/** 
PING INTEGRATION:
This entire component is Ping-developed.
Implements functions to integrate with PingFederate
authentication-related API endpoints.

@author Michael Sanchez
*/

/* eslint-disable no-useless-escape */

class PingAuthN {

    // Didn't abstract these since they shouldn't ever change.
    pfAuthnAPIURI = "/pf-ws/authn/flows/";
    pfPickupURI = "/ext/ref/pickup?REF=";

    /** 
    AuthN API:
    Authenticating user with AuthN API.

    @param {string} method The HTTP request verb.
    @param {string} flowId The flowId from the initiated AuthN API response.
    @param {string} contentType The content type required for the submitted payload.
    @param {object} body The payload to send in the API body in JSON format.
    @return {object} The response JSON object.
    */
    authnAPI({ method, flowId, contentType, payload, action }) {
        console.info("PingAuthN.js", "Authenticating user with authN API.");

        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('X-XSRF-Header', 'PingFederate');
        if (contentType !== undefined) { headers.append('Content-Type', contentType); }

        const requestOptions = {
            headers: headers,
            method: method,
            body: payload,
            credentials: 'include'
        }
        let url = this.pfAuthnAPIURI + flowId;
        if (action !== undefined) { url += "?action=" + action; }
        return fetch(url, requestOptions);
    }

    /** 
    Handle AuthN Flow:
    Handler for different AuthN API flows. UI components shouldn't deal with
    API calls. They just need to know about the user and what their next move is.

    @param {object} flowResponse The response object in JSON format.
    @param {string} identifier The userName or email of the authenticating user.
    @param {string} swaprods The user's password if doing password authentication.
    */
    handleAuthNflow({ flowId, flowResponse, swaprods, rememberMe, body }) {
        console.info("PingAuthN.js", "Handling flow response from authN API.");
        console.info("FlowResponse was", JSON.stringify(flowResponse));

        let payload = '{}';
        if (!flowResponse) { flowResponse = {}; } //This won't exist if we only get a flowId. So create it to let switch/case default kick in.
        switch (flowResponse.status) {
            case "IDENTIFIER_REQUIRED":
                console.info("PingAuthN.js", "IDENTIFIER_REQUIRED");
                payload = '{\n  \"identifier\": \"' + body + '\"\n}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, contentType: "application/vnd.pingidentity.submitIdentifier+json", payload: payload });
            case "USERNAME_PASSWORD_REQUIRED":
                console.info("PingAuthN.js", "USERNAME_PASSWORD_REQUIRED");
                payload = '{\n \"username\": \"' + flowResponse.username + '\", \"password\": \"' + swaprods + '\", \"rememberMyUsername\": \"' + rememberMe + '\", \"captchaResponse\": \"\" \n}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, contentType: "application/vnd.pingidentity.checkUsernamePassword+json", payload: payload });
            case "AUTHENTICATION_REQUIRED":
                console.info("PingAuthN.js", "AUTHENTICATION_REQUIRED");
                payload = '{' + body + '}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, contentType: "application/vnd.pingidentity.authenticate+json", payload: payload });
            case "DEVICE_SELECTION_REQUIRED":
                console.info("PingAuthN.js", "DEVICE_SELECTION_REQUIRED");
                payload = '{\n \"deviceRef\": {\n \"id\":\"' + body + '\" \n} \n}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, payload: payload, action: "selectDevice" });
            case "OTP_REQUIRED":
                console.info("PingAuthN.js", "OTP_REQUIRED");
                payload = '{\n \"otp\": \"' + body + '\" \n}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, payload: payload, action: "checkOtp" });
                // this case is a placeholder for mobile push. Needs to be updated.
            case "PUSH_CONFIRMATION_WAITING":
                console.info("PingAuthN.js", "fubar_REQUIRED");
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, action: "poll" });
            case "MFA_COMPLETED":
                console.info("PingAuthN.js", "MFA_COMPLETED");
                payload = '{' + body + '}';
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, payload: payload, action: "continueAuthentication" });
            case "DEVICE_PROFILE_REQUIRED":
                console.info("PingAuthN.js", "DEVICE_PROFILE_REQUIRED");
                console.info("Device Profile", body);
                payload = body;
                return this.authnAPI({ method: "POST", flowId: flowResponse.id, payload: payload, action: "submitDeviceProfile" });
            case "RESUME":
                console.info("PingAuthN.js", "Authentication complete. Redirecting to resumeURL.");
                window.location.assign(flowResponse.resumeUrl);
                break;
            case "FAILED":
                console.warn("PingAuthN.js", flowResponse.message);
                return flowResponse;
            default: // Just started the authN API flow, only have a flowId.
                console.info("PingAuthN.js", "Starting authN API flow.");
                return this.authnAPI({ method: "GET", flowId: flowId });
        }
    }

    /** 
    Pick Up API:
    Agentless Integration Kit Pickup endpoint.

    @param {string} REF The ref Id returned with the authenticated user.
    @return {object} The response JSON object.
    */
    pickUpAPI(REF, adapter) {
        console.info("PingAuthN.js", "Attribute pickup from Agentless IK.");

        const refId = REF;
        const myHeaders = new Headers();
        myHeaders.append("ping.instanceid", adapter);
        myHeaders.append("Authorization", "Basic cmVhY3QtdXNlcjoyRmVkZXJhdGVNMHJl"); /* TODO should we obfuscate somehow. */

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            credentials: 'include'
        };

        const url = this.pfPickupURI + refId

        return fetch(url, requestOptions);
    }
}

export default PingAuthN;
