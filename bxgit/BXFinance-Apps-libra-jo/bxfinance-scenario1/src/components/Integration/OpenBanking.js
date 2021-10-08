/**
PING INTEGRATION:
This entire component is Ping-developed.
Implements functions to integrate with 
David Babbit's mock OpenBanking APIs, hosted on Heroku.
I like to call it the OpenBabbitt API.

@author Michael Sanchez
@see {@link https://github.com/babbtx/mock-simple-aspsp}
*/

class OpenBanking {

    /**
    Configurations for the OpenBanking API. 

    @property {string} mockOBConsentHost Consent OpenBanking host /OpenBanking pointing to DataGovernance to secure data for consent enforcement.
    @property {string} mockOBhost OpenBaking API host.
    @property {string} mockOBAPIver OpenBanking API version.
    @property {string} mockOBbalURI OpenBanking API account balances path.
    @property {string} mockOBacctsURI OpenBanking API accounts path.
    @property {string} xfrMoneyURI OpenBanking API transfer money path.
    */
    constructor() {
        // Didn't abstract these since they shouldn't ever change. I say that now.
        this.mockOBhost = "https://babbtx-aspsp.herokuapp.com/OpenBanking";
        // this.mockOBhost = "https://staging-babbtx-aspsp.herokuapp.com/OpenBanking/v2/accounts"; //TODO only use staging server for testing changes.
        this.mockOBAPIver = "/v2";
        this.mockOBbalURI = "/balances";
        this.mockOBacctsURI = "/accounts";
        this.xfrMoneyURI = "/transferMoney?amount=";
    }

    /** 
      Provision Banking Accounts:
      Provisions new accounts and balances and updates the user entry in PingDirectory.
      Design pattern debate: Whether to just return the accounts response (strict single responsiblilty), or
      or as is now, fulfills all tasks of "provisioning an acct", which should include upating the user entry.

      @param {string} token The access token for the authenticated user.
      @return {object} The response JSON object.
      */
    async provisionAccounts(token) {
        //If we had to time to be cool, we could have extracted the uid from the token.
        console.info("OpenBanking.js", "Provisioning bank accounts.");

        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        const url = this.mockOBhost + this.mockOBAPIver + this.mockOBacctsURI;

        const response = await fetch(url, requestOptions);
        const jsonData = await response.json();
        return Promise.resolve(jsonData);
    }

    /** 
      Get Account Balances:
      Retreives account balances to display on the Accounts Dashboard.

      @param {string} token The access token for the authenticated user.
      @return {object} The response JSON object.
      */
    getAccountBalances(token) {
        console.info("OpenBanking.js", "Getting bank account balances.");

        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        const url = this.mockOBhost + this.mockOBAPIver + this.mockOBbalURI;
        return fetch(url, requestOptions);
    }

    /** 
    Transfer Money:
    Initiates a money transfer between accounts.

    @param {number} amount The dollar amount the user wants to transfer.
    @param {string} token The access token from PF for the authenticated user.
    @return {boolean} Success state of the transfer.
    */
    transferMoney(amount, token) {
        console.info("OpenBanking.js", "Transferring money.");

        let myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);

        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        const url = this.xfrMoneyURI + amount;
        return fetch(url, requestOptions);
    }
};

export default OpenBanking; 
