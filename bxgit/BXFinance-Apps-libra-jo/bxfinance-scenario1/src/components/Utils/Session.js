/**
PING INTEGRATION:
This entire component is Ping-developed.
Implements functions to integrate with the browser
session storage API to maintain user state during
an authenticated session.

@author Michael Sanchez
@see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage}
*/

class Session {

    /** 
    Protect Page:
    Ensures a user doesn't access pages when unauthenticated or 
    when not the right user type. As a Single Page Application (SPA), page requests do not
    run through PingAccess, (not HTTP requests), so we need to replicate those access rules.

    @param {boolean} loggedOut Whether the user is logged in or not.
    @param {string} path Where the user is trying to go.
    @param {string} userType AnyWealthAdvisor, AnyMarketing, or customer.
    */
   protectPage(loggedOut, path, userType) {
       const advisorAllowedPaths = ["/app/advisor", "/app/advisor/client", "/app/advisor/tracking", "/app/advisor/prospecting", "/app/advisor/other-services"];
       const marketingAllowedPaths = ["/app/any-marketing", "/app/any-marketing/dashboard", "/app/any-marketing/client-profiles", "/app/any-marketing/tracking", "/app/any-marketing/equities-trading"];
       const homePaths = ["/app/", "/app"];
       const startSSOURI = "/idp/startSSO.ping?PartnerSpId=" + window._env_.REACT_APP_HOST + "&TargetResource=" + window._env_.REACT_APP_HOST + "/app/credit-card";
       const creditCardPath = "/app/credit-card";
       console.info("Session.js", "Checking access rules for type " + userType + " at " + path);
       
       //They have to be logged in to be anywhere other than home.
       if (loggedOut && path === creditCardPath) {
           console.info("Access rule", "Attempting to access protected page as unauthenticated user. Starting SSO for credit-card.");
           window.location.assign(startSSOURI);
        } else if (loggedOut && (!homePaths.includes(path))) {
            console.info("Access rule", "Attempting to access protected page as unauthenticated user. Redirecting to home.");
            window.location.assign(homePaths[0]);
        } else {
           switch (userType) {
               case "AnyWealthAdvisor":
                   if (!advisorAllowedPaths.includes(path)) {
                       console.info("Access Rule", "Attempt to access disallowed resource for user type " + userType + ". Redirecting to default.");
                       window.location.assign(advisorAllowedPaths[0]);
                   }
                   break;
               case "AnyMarketing":
                   if (!marketingAllowedPaths.includes(path)) {
                       console.info("Access Rule", "Attempt to access disallowed resource for user type " + userType + ". Redirecting to default.");
                       window.location.assign(marketingAllowedPaths[0]);
                   }
                   break;
               case "customer":
                   if (advisorAllowedPaths.includes(path) || marketingAllowedPaths.includes(path) || homePaths.includes(path)) {
                       console.info("Access Rule", "Attempt to access disallowed resource for user type " + userType + ". Redirecting to default.");
                       window.location.assign("/app/banking"); //Default for a logged in user
                   }
                   break;
               default:
                   console.warn("Unknown bxFinanceUserType", "Not authenticated yet.");
           }
        }        
   }

    /** 
    Get Authenticated User Item:
    Gets an item from the current origin's session storage.

    @param {string} key The item name in storage.
    @return {string} DOM String.
    */
    getAuthenticatedUserItem(key) {
        console.info("Session.js", "Getting " + key + " from local browser session.");

        return sessionStorage.getItem(key);
    }

    /** 
    Set Authenticated User Item:
    Sets an item in the current origin's sessions storage.

    @param {string} key The item name to set in storage.
    @param {string} value The string value of the key.
    @return {boolean} Success state of item storage.
    @throws {storageFullException} Particularly, in Mobile Safari 
                                (since iOS 5) it always throws when 
                                the user enters private mode. 
                                (Safari sets the quota to 0 bytes in 
                                private mode, unlike other browsers, 
                                which allow storage in private mode 
                                using separate data containers.)
    */
    setAuthenticatedUserItem(key, value) {
        console.info("Session.js", "Saving " + key + " into local browser session.");

        sessionStorage.setItem(key, value);
        return true;
    }

    /** 
    Remove Authenticated User Item:
    Removes an item from the current origin's session storage.

    @param {string} key The item name in storage to remove.
    @return {boolean} Success state of item removal from storage.
    */
    removeAuthenticatedUserItem(key) {
        console.info("Session.js", "Removing " + key + " from local browser session.");

        sessionStorage.removeItem(key);
        return true;
    }

    /** 
    Clear User App Session:
    Clears out everything in the current origin's session storage.

    @return {void} Void. 
     */
    clearUserAppSession() {
        console.info("Session.js", "Removing local browser session.");

        sessionStorage.clear();
    }

    /** 
    Get Cookie:
    We set a cookie when users check "Remember Me" when logging in.
    We need to check for this cookie in a couple different places to set state.
    
    @param {string} cookieName The name of the cookie we want the value of.
    @return {string} Cookie value, or an empty string if not found.
    */
    getCookie(cookieName) {
        console.info("Session.js", "Getting a cookie value from the browser.");

        const name = cookieName + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
};

export default Session;