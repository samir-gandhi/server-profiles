import Session from '../Utils/Session';

/**
PING INTEGRATION:
This entire component is Ping developed.
Implements functions to integrate with PingFederate
OAuth-related API endpoints.

@author Michael Sanchez
*/

class PingOAuth {
    constructor() {
        this.Session = new Session();
    }

    // Didn't abstract these since they shouldn't ever change.
    pfAuthZAPIURI = "/as/authorization.oauth2?";
    pfTokenAPIURI = "/as/token.oauth2?";

    /** 
    Get AuthZ Code:
    We defaulted all params except for uid, 
    which is user specifc. As a demo site, we only have 1
    auth code client. But if we add more in the future, this
    will already support that.

    @param {string} client The OAuth client. Default is pa_wam .
    @param {string} responseType The OAuth client-supported response type. Default is code.
    @param {string} redirectURI The OAuth client-allowed redirect URI(s). Default is https://demo.bxfinance.org/app/banking .
    @param {string} scopes Optional OAuth scopes. Default is an empty string.
    @return {string} AuthZ code.
    */
    async getAuthCode({client = "pa_wam", responseType = "code", redirectURI = window._env_.REACT_APP_HOST + "/app/banking", scopes = ""} = {}) {
        console.info("PingOAuth.js", "Getting an auth code for the getToken() call.");

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlEncodedBody");
        myHeaders.append("Authorization", "Basic cGFfd2FtOjJGZWRlcmF0ZU0wcmU=");

        const urlEncodedBody = new URLSearchParams();
        
        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: urlEncodedBody,
            redirect: 'follow'
        };
        
        const url = this.pfAuthZAPIURI + "response_type=" + responseType + "&client_id=" + client + "&redirect_uri=" + redirectURI + "&scope=" + scopes;
        const response = await fetch(url, requestOptions);
        const authCode = response.url.substring(response.url.search("=") + 1);

        return authCode;
    }

    /** 
    Get Token:
    We defaulted all params except for code,
    which is code flow specifc. As a demo site, we only have 1
    auth code client. But if we add more in the future, this
    will already support that.

    @param {string} client The OAuth client. Default is pa_wam .
    @param {string} responseType The OAuth client-supported response type. Default is code.
    @param {string} redirectURI The OAuth client-allowed redirect URI(s). Default is https://demo.bxfinance.org/app/banking .
    @param {string} scopes Optional OAuth scopes. Default is an empty string.
    @return {string} OAuth access token, base64 encoded.
    */
    async getToken({uid, client = "pa_wam", responseType = "code", redirectURI = window._env_.REACT_APP_HOST + "/app/banking", scopes = ""} = {}) {
        console.info("PingOAuth.js", "Getting a token.");

        if (responseType === "code") {
            console.info("PingAuthN.js", "Using auth code grant");
            const authCode = await this.getAuthCode({uid:this.Session.getAuthenticatedUserItem("uid"), scopes:scopes});
            let grantType = "authorization_code";

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/x-www-form-urlEncodedBody");
            myHeaders.append("Authorization", "Basic cGFfd2FtOjJGZWRlcmF0ZU0wcmU=");

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                redirect: 'follow'
            };
            const url = this.pfTokenAPIURI + "grant_type=" + grantType + "&redirect_uri=" + redirectURI + "&code=" + authCode;
            const response = await fetch(url, requestOptions);
            const jsonData = await response.json();
            const token = await jsonData.access_token;
            console.info("PingOAuth.js", "TOKEN: " + token);

            return token; //TODO there should only be one return statement.

        } else if (client === "marketingApp" || client === "anywealthadvisorApp") {
            console.info("PingAuthN.js", "Using client credentials grant");
            let grantType = "client_credentials";
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
            myHeaders.append("username", uid);

            var urlencoded = new URLSearchParams();
            urlencoded.append("client_id", client);
            urlencoded.append("client_secret", "2Federate");

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: urlencoded,
                redirect: 'follow'
            };

            const url = this.pfTokenAPIURI + "grant_type=" + grantType;
            const response = await fetch(url, requestOptions);
            const jsonData = await response.json();
            const token = await jsonData.access_token;
            console.info("PingAuthN.js Token =", token);

            return token;
                
        } else {
            // If you ended up here, you coded yourself into this problem.
            throw new Error("PingOAuth.js", "Unexpected response_type or client exception in getToken().");
        }
    }
};

export default PingOAuth;
