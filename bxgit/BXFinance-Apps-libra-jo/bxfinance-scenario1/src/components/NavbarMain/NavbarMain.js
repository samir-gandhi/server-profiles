// Packages
import React from 'react';
import {
  Collapse,
  Container,
  Navbar,
  NavbarToggler,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';
import { Link, NavLink as RRNavLink } from 'react-router-dom';

// Components
import ModalRegister from '../ModalRegister';
import ModalRegisterConfirm from '../ModalRegisterConfirm';
import ModalLogin from '../ModalLogin';
import PingAuthN from '../Integration/PingAuthN'; /* PING INTEGRATION */
import Session from '../Utils/Session'; /* PING INTEGRATION */
import ModalError from '../ModalError'; /* PING INTEGRATION: */
import './NavbarMain.scss';
import IdleTimer from 'react-idle-timer'; /* PING INTEGRATION: */
import { IdleTimeOutModal } from '../ModalTimeout/IdleTimeOutModal'; /* PING INTEGRATION: */
// Data
import data from './data.json';

class NavbarMain extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      loggedOut: true, /* PING INTEGRATION: */
      timeout: 1000 * 60 * 30, /* PING INTEGRATION: for react-idle-timer */
      showTimeoutModal: false, /* PING INTEGRATION: for react-idle-timer */
      isTimedOut: false /* PING INTEGRATION: for react-idle-timer */
    };
    /* BEGIN PING INTEGRATION: */
    this.PingAuthN = new PingAuthN();
    this.Session = new Session();
    this.IdleTimer = null;
    this.onAction = this._onAction.bind(this); /* PING INTEGRATION: for react-idle-timer */
    this.onActive = this._onActive.bind(this); /* PING INTEGRATION: for react-idle-timer */
    this.onIdle = this._onIdle.bind(this); /* PING INTEGRATION: for react-idle-timer */
    this.handleClose = this.handleClose.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    
    this.startSSOURI = "/idp/startSSO.ping?PartnerSpId=" + window._env_.REACT_APP_HOST + "&TargetResource=" + window._env_.REACT_APP_HOST + "/app/banking"; //TODO this needs to be moved to ping-endpoints.json
    //The TargetResource param for registration is set to the startSSO endpoint to after reg we immediately trigger a login flow for better UX.
    this.pfRegURI = "/sp/startSSO.ping?SpSessionAuthnAdapterId=idprofiledefaultIdentityProfile&PolicyAction=identity.registration&TargetResource=" + window._env_.REACT_APP_HOST + window._env_.PUBLIC_URL + "/";
    /* END PING INTEGRATION: */
  }

  /* BEGIN PING INTEGRATION: for react-idle-timer */
  _onAction(e) {
    // console.info("React-idle-timer", 'user did something', e);
    this.setState({ isTimedOut: false });
  }

  _onActive(e) {
    console.info("React-idle-timer", 'user is active', e);
    this.setState({ isTimedOut: false });
  }

  _onIdle(e) {
    console.info("React-idle-timer", 'user is idle', e);
    // const isTimedOut = this.state.isTimedOut;
    if (this.state.isTimedOut) {
      this.startSLO();
    } else {
      this.setState({
        showTimeoutModal: true,
        isTimedOut: true,
      });
      this.IdleTimer.reset();
    }

  }
  closeTab() {
    window.close();
  }
  handleClose() {
    console.info("We are closing the timeout modal.");
    this.setState({ showTimeoutModal: false });
    window.location.assign(this.startSSOURI); //TODO we Send back through PF to renew the session. This should be done via API.
  }
  handleLogout() {
    console.info("We are logging out from the timeout modal.");
    this.startSLO();
  }
  /* END PING INTEGRATION: for react-idle-timer */

  triggerModalRegister() {
    this.refs.modalRegister.toggle();
  }
  onModalRegisterSubmit() {
    this.refs.modalRegister.toggle();
    this.refs.modalRegisterConfirm.toggle();
  }
  triggerModalRegisterConfirm() {
    this.refs.modalRegisterConfirm.toggle();
  }
  triggerModalLogin() {
    /* BEGIN PING INTEGRATION */
    // Decided to just trigger an authn flow anytime we call this method.
    window.location.assign(this.startSSOURI);
    /* The below logic had the risk of submitting username to an expired flowId if the user just sat there for a time. 
    if (!window.location.search) {
      window.location.assign(this.startSSOURI);
    }
    else { 
      this.refs.modalLogin.toggle(); //This is left here just in case the user closes the modal and clicks "sign in" after we already have a flowId in the URL.
    } END PING INTEGRATION */
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  /* BEGIN PING INTEGRATION */
  startSLO() {
    console.info("NavbarMain.js", "Logging out.");

    //end the local app session
    this.Session.clearUserAppSession();
    //An advisor should just be taken back to P14E dock. A partner persona shouldn't get SLO'd.
    if (window.location.pathname === "/app/advisor/client" || window.location.pathname === "/app/advisor") {
      //TODO IMPORTANT this P14E dock needs to be an env_var or injected during spin up in k8s. It will make it easier for anyone that want to clone their own instance of BXF.
      window.location.assign("https://desktop.pingone.com/anywealthadvisor/");
    } else {
      //Banking customers get SLO'd.
      const url = "/sp/startSLO.ping?TargetResource=" + window._env_.REACT_APP_HOST + window._env_.PUBLIC_URL + "/";
      window.location.assign(url);
    }

  }
  /* END PING INTEGRATION: */

  componentDidMount() {
    // BEGIN PING INTEGRATION
    const isLoggedOut = (this.Session.getAuthenticatedUserItem("subject") === null || this.Session.getAuthenticatedUserItem("subject") === 'undefined') ? true : false;
    this.Session.protectPage(isLoggedOut, window.location.pathname, this.Session.getAuthenticatedUserItem("bxFinanceUserType"));

    this.setState({ loggedOut: isLoggedOut });

    // Check for a querystring; Will be fowId or REF in our current use cases.
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      //If we're coming back from registration, immediately kickoff the login flow for better UX.
      if (params.get("LocalIdentityProfileID")) { this.triggerModalLogin() }

      // Coming back from authN API.
      if (params.get("flowId")) {
        this.PingAuthN.handleAuthNflow({ flowId: params.get("flowId") })
          .then(response => response.json())
          .then(jsonResult => {
            let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResult)); //Browser's sessionStorage object only stores strings.
            if (jsonResult.status === "IDENTIFIER_REQUIRED") {
              //pop the ID first modal. 
              this.refs.modalLogin.toggle();
            } else if (jsonResult.status === "FAILED") {
              this.refs.modalError.toggle(jsonResult.message, jsonResult.userMessage);
            }
          })
          .catch(error => console.error('HANDLESUBMIT ERROR', error));
      } // Coming back as authenticated user from AIK or SLO request from Agentless IK.
      else if (params.get("REF")) {
        const REF = params.get("REF");
        let targetApp = decodeURIComponent(params.get("TargetResource"));
        const adapter = (targetApp.includes("marketing") || targetApp.includes("advisor")) ? "AdvisorSPRefID" : "BXFSPRefID";

        this.PingAuthN.pickUpAPI(REF, adapter)
          .then(response => response.json())
          .then((jsonData) => {
            console.info("Pickup response", jsonData);
            if (jsonData.resumePath) { // Means we are in a SLO request. SSO uses resumeURL.
              this.Session.clearUserAppSession();
              /* 
              SP-init front-channel SLO with AIK won't work in a pure SPA.
              All sessions are properly revoked but the PF cookie changes after
              the REF pickup, so the resumePath returns an Expired page.
              Since all sessions are cleaned up, we are just handling the redirect
              back to the TargetResource ourselves which is /app/.
              */
              targetApp = window._env_.REACT_APP_HOST + window._env_.PUBLIC_URL + "/";
              //targetApp = jsonData.resumePath + "?source=" + adapter;
            }
            else if (jsonData.bxFinanceUserType === "AnyWealthAdvisor" || jsonData.bxFinanceUserType === "AnyMarketing") {
              this.Session.setAuthenticatedUserItem("email", jsonData.Email);
              this.Session.setAuthenticatedUserItem("subject", jsonData.subject);
              this.Session.setAuthenticatedUserItem("firstName", jsonData.FirstName);
              this.Session.setAuthenticatedUserItem("lastName", jsonData.LastName);
              this.Session.setAuthenticatedUserItem("uid", jsonData.uid);
              this.Session.setAuthenticatedUserItem("bxFinanceUserType", jsonData.bxFinanceUserType);
            } else { //banking customer
              this.Session.setAuthenticatedUserItem("email", jsonData.Email);
              this.Session.setAuthenticatedUserItem("subject", jsonData.subject);
              this.Session.setAuthenticatedUserItem("firstName", jsonData.FirstName);
              this.Session.setAuthenticatedUserItem("lastName", jsonData.LastName);
              this.Session.setAuthenticatedUserItem("uid", jsonData.uid);
              this.Session.setAuthenticatedUserItem("pfSessionId", jsonData.sessionid);
              this.Session.setAuthenticatedUserItem("street", jsonData.street);
              this.Session.setAuthenticatedUserItem("mobile", jsonData.mobile);
              this.Session.setAuthenticatedUserItem("city", jsonData.city);
              this.Session.setAuthenticatedUserItem("zipcode", jsonData.postalCode);
              const fullAddress = jsonData.street + ", " + jsonData.city + ", " + jsonData.postalCode;
              this.Session.setAuthenticatedUserItem("fullAddress", fullAddress);
              this.Session.setAuthenticatedUserItem("bxFinanceUserType", "customer"); //This is the default. Only dynamically set for partner/workforce.
            }
            // TODO can we do this SPA style with history.push? We would need to map targetApp to respective Router path.
            window.location.assign(targetApp);
          })
          .catch(error => {
            console.error("Agentless Pickup Error:", error);
            this.refs.modalError.toggle("Session Pickup Error", error);
          });
      } 
    }
    // END PING INTEGRATION
    // Original T3 code in this lifecycle method removed.
  }

  render() {
    const { match } = this.props;
    return (
      <section className="navbar-main">
        {/* DESKTOP NAV */}
        <Navbar color="dark" dark expand="md" className="navbar-desktop">
          <Container>
            <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/logo-white.png"} alt={data.brand} /></Link>
            <NavbarToggler onClick={this.toggle.bind(this)} />
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className="justify-content-end ml-auto navbar-nav-utility" navbar>
                <NavItem>
                  <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/search.svg"} alt={data.menus.utility.search} /></NavLink>
                </NavItem>
                <NavItem>
                  <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/map-marker.svg"} alt={data.menus.utility.locations} /></NavLink>
                </NavItem>
                <NavItem>
                  <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/support.svg"} alt={data.menus.utility.support} /></NavLink>
                </NavItem>
                {/* BEGIN PING INTEGRATION: added conditional rendering logic for Sign In/Out links. */}
                {window.location.pathname === "/app/credit-card" &&
                  <NavItem className="login">
                    <NavLink href="#" onClick={this.closeTab.bind(this)}><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.close} className="mr-1" /> {data.menus.utility.close}</NavLink>
                  </NavItem>}
                {this.state.loggedOut &&
                  <NavItem className="login">
                    <NavLink href="#" onClick={this.triggerModalLogin.bind(this)}><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.login} className="mr-1" /> {data.menus.utility.login}</NavLink>
                  </NavItem>}
                {!this.state.loggedOut && window.location.pathname !== "/app/credit-card" &&
                  <NavItem className="logout">
                    <Link to="/" onClick={this.startSLO.bind(this)} className="nav-link"><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.logout} className="mr-1" /> {data.menus.utility.logout}</Link>
                  </NavItem>}
                {this.state.loggedOut &&
                  <NavItem className="register">
                    <NavLink href={this.pfRegURI}>{data.menus.utility.register_intro} <strong>{data.menus.utility.register}</strong></NavLink>
                  </NavItem>}
                {/* END PING INTEGRATION */}
              </Nav>
            </Collapse>
          </Container>
          {/* BEGIN PING INTEGRATION */}
          {!this.state.loggedOut &&
            <IdleTimer
              ref={ref => { this.IdleTimer = ref }}
              element={document}
              onActive={this.onActive}
              onIdle={this.onIdle}
              onAction={this.onAction}
              debounce={250}
              timeout={this.state.timeout} />}
          {!this.state.loggedOut &&
            <IdleTimeOutModal
              showModal={this.state.showTimeoutModal}
              handleClose={this.handleClose}
              handleLogout={this.handleLogout}
            />}
          {/* END PING INTEGRATION */}
        </Navbar>
        <Navbar color="dark" dark expand="md" className="navbar-desktop">
          <Container>
            <Nav className="mr-auto navbar-nav-main" navbar>
              {this.props && this.props.data && this.props.data.menus && this.props.data.menus.primary ? (
                this.props.data.menus.primary.map((item, i) => {
                  return (
                    <NavItem key={i}>
                      <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>
                    </NavItem>
                  );
                })
              ) : (
                  data.menus.primary.map((item, i) => {
                    return (
                      <NavItem key={i}>
                        {window.location.pathname !== "/app/credit-card" &&
                          <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>}
                        {window.location.pathname === "/app/credit-card" &&
                          <NavLink to={"#"} activeClassName="active" exact >{item.title}</NavLink>}
                      </NavItem>
                    );
                  })
                )}
            </Nav>
          </Container>
        </Navbar>
        {/* MOBILE NAV */}
        <Navbar color="dark" dark expand="md" className="navbar-mobile">
          <div className="mobilenav-menu">
            <NavbarToggler onClick={this.toggle.bind(this)} />
          </div>
          <div className="mobilenav-brand">
            <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/logo-white.png"} alt={data.brand} /></Link>
          </div>
          <div className="mobilenav-login">
            <NavLink href="#" className="login" onClick={this.triggerModalLogin.bind(this)}>Sign In</NavLink>
            <Link to="/" className="nav-link logout d-none">Sign Out</Link>
          </div>
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className="navbar-nav-main navbar-light bg-light" navbar>
              {this.props && this.props.data && this.props.data.menus && this.props.data.menus.primary ? (
                this.props.data.menus.primary.map((item, i) => {
                  return (
                    <NavItem key={i}>
                      <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>
                    </NavItem>
                  );
                })
              ) : (
                  data.menus.primary.map((item, i) => {
                    return (
                      <NavItem key={i}>
                        {window.location.pathname !== "/app/credit-card" && 
                          <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>}
                        {window.location.pathname === "/app/credit-card" &&
                          item.title}
                      </NavItem>
                    );
                  })
                )}
            </Nav>
            <Nav className="navbar-nav-utility" navbar>
              <NavItem>
                <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/search.svg"} alt={data.menus.utility.search} className="mr-1" /> {data.menus.utility.search}</NavLink>
              </NavItem>
              <NavItem>
                <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/map-marker.svg"} alt={data.menus.utility.locations} className="mr-1" /> {data.menus.utility.locations}</NavLink>
              </NavItem>
              <NavItem>
                <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/support.svg"} alt={data.menus.utility.support} className="mr-1" /> {data.menus.utility.support}</NavLink>
              </NavItem>
              <NavItem className="login">
                <NavLink href="#" onClick={this.triggerModalLogin.bind(this)}><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.login} className="mr-1" /> {data.menus.utility.login}</NavLink>
              </NavItem>
              <NavItem className="logout d-none">
                <Link to="/" className="nav-link"><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.logout} className="mr-1" /> {data.menus.utility.logout}</Link>
              </NavItem>
              <NavItem className="register">
                {/* PING INTEGRATION: added env var and link to PF LIP reg form. */}
                <NavLink href={this.pfRegURI}><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.logout} className="mr-1" /> {data.menus.utility.register}</NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
        <ModalRegister ref="modalRegister" onSubmit={this.onModalRegisterSubmit.bind(this)} />
        <ModalRegisterConfirm ref="modalRegisterConfirm" />
        <ModalLogin ref="modalLogin" />
        <ModalError ref="modalError" />{/* PING INTEGRATION */}
      </section>
    );
  }
}

export default NavbarMain;
