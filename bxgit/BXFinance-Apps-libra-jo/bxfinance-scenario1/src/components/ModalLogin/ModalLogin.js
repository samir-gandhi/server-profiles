/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

// Packages
import React from 'react';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  Input,
  CustomInput,
  TabContent, TabPane
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

// Styles
import "./ModalLogin.scss";

// Data
import data from './data.json';

import PingAuthN from '../Integration/PingAuthN'; /* PING INTEGRATION */
import Session from '../Utils/Session'; /* PING INTEGRATION: */
import ModalLoginPassword from '../ModalLoginPassword/ModalLoginPassword'; /* PING INTEGRATION: */

class ModalLogin extends React.Component {
  constructor() {
    super();

    this.state = {
      isOpen: false,
      activeTab: '1',
      loginMethodUnset: true,
      loginMethodFormGroupClass: '',
      deviceRef: "",          /* PING INTEGRATION: Selected device's Id */
      deviceName: "",         /* PING INTEGRATION: Device name if using mobile app. I.e. iPhone XS Max */
      loginMethod: "",        /* PING INTEGRATION: SMS, Email, iPhone, TOTP */
      loginTarget: "",        /* PING INTEGRATION: number or email of selected login method. */
      deviceList: [],         /* PING INTEGRATION: */
      otp: "",                /* PING INTEGRATION: */
      userName: '',           /* PING INTEGRATION */
      email: ''              /* PING INTEGRATION */
    };
    this.PingAuthN = new PingAuthN();   /* PING INTEGRATION: */
    this.Session = new Session();       /* PING INTEGRATION: */
  }

  /* BEGIN PING INTEGRATION: */
  // function as class property. // Note: Per reactjs.org this syntax is experimental and not standardized yet. (Stage 3 proposal).
  //Used to update device selection tabPane based on user's list of paired devices.
  deviceExists = (type) => {
    let deviceFound = false;
    const deviceListFlat = this.state.deviceList.flat();

    if (deviceListFlat.indexOf(type) > -1) {
      deviceFound = true;
    }

    return deviceFound;
  }
  /* END PING INTEGRATION: */

  onClosed() {
    this.setState({
      activeTab: '1',
      loginMethodUnset: true,
      deviceRef: "",          /* PING INTEGRATION: */
      loginMethod: "",        /* PING INTEGRATION: */
      deviceList: [],         /* PING INTEGRATION: */
      loginTarget: "",        /* PING INTEGRATION: */
      loginMethodFormGroupClass: '' // Doubt we need this. See comment below on same var.
    });
  }
  toggle(tab) {
    this.setState({
      isOpen: !this.state.isOpen
    });
    /* BEGIN PING INTEGRATION: calling from NavbarMain upon return.
    Can't call toggleTab or we'll end up in endless loop. */
    //TODO better explanation needs to be here. WTF?
    if (tab === '4') {
      this.setState({
        activeTab: tab
      });
    }
    /* END PING INTEGRATION: */
  }
  toggleTab(tab) {
    this.setState({
      activeTab: tab
    });
    //Hack for getting focus on the OTP field.... because reactstrap. :-(
    if (tab ==="3"){document.getElementById("otp").focus();}
  }

  setLoginMethod(event) {
    /* BEGIN PING INTEGRATION: had to make this kind of polymorphic due to a late feature add of the "default device" concept in P1MFA. */
    let deviceSelection = "";
    let deviceId = "";
    let deviceRefIndex;
    let target = "";
    let name = "";
    const deviceList = this.state.deviceList;

    if (typeof event === "string") { //This will be the defaulted device Id.
      deviceId = event;
      deviceRefIndex = deviceList.findIndex((element, index) => {
        return element.includes(deviceId);
      });
      deviceSelection = deviceList[deviceRefIndex][0];
    } else { //We got the selected device from the user in the device selection UI.
      const delimiterPos = event.target.id.lastIndexOf("_");
      deviceSelection = event.target.id.substring(delimiterPos + 1);
      deviceRefIndex = deviceList.findIndex((element, index) => {
        return element.includes(deviceSelection);
      });

      deviceId = event.target.getAttribute("did");
    }

    target = deviceList[deviceRefIndex][2];
    name = deviceList[deviceRefIndex][3];

    this.setState(previousState => {//TODO not referencing previousState anymore. should get rid of this and just do standard setState instead of arrow function.
      return {
        deviceRef: deviceId,
        loginTarget: target,
        loginMethod: deviceSelection,
        deviceName: name,
        loginMethodUnset: false,
        loginMethodFormGroupClass: 'form-group-light'
      }
    });
    /* END PING INTEGRATION: */
  }

  // BEGIN PING INTEGRATIONS
  handleIDChange(event) {
    // grabbing whatever the user is typing in the ID first form as they type, and
    // saving it to state. (Controlled input).
    this.setState({ userName: event.target.value.trim() });
  }

  handleOTPChange(event) {
    // grabbing whatever the user is typing in the OTP form as they type, and
    // saving it to state. (Controlled input).
    this.setState({ otp: event.target.value });
  }

  handleEmailChange(event) {
    //This is not used since PF is handling SSPR to demo Velocity templates.
    // Keeping it here in case Velocity templates get nixed from demos.
    // Grabbing whatever the user is typing in the email form as they type, and
    // saving it to state.
    this.setState({ email: event.target.value });
  }

  // When user clicks "Next".
  // Handler for various TabPane UIs.
  // TODO T3 used numeric IDs for the TabPanes in render(). With our handler, 
  // it would be easier to visually map in the code if they had text IDs related to the UI of the TabPane. I.e. "IDF", "Devices", etc.
  handleSubmit(tab) {
    //Need to parse this as JSON because the browser's sessionStorage object only stores strings.
    const cachedFlowResponse = JSON.parse(this.Session.getAuthenticatedUserItem("flowResponse"));

    if (window.location.search) {/* TODO what do we do if they submit with no querystring? Is that even possible? If not, do we even need the test for window.location.search??? */
      let payload = "";

      switch (tab) { // Each case corresponds to a tab pane in the UI. 
        case "1":
          // IDF form. This is the default state for the component (see constructor). Will probably never be called from UI.
          this.toggleTab("1");
          break;
        case "2":
          //Password modal or device selection. If password, we toggle to a new UI.
          payload = this.state.userName;
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, body: payload })
            .then(response => response.json())
            .then(jsonResult => {
              let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResult));
              if (jsonResult.status === "USERNAME_PASSWORD_REQUIRED") {
                //Close ModalLogin. We need to get password.
                this.toggle();
                //swap modals for username/password modal.
                this.refs.modalLoginPassword.toggle(this.state.userName);
              } else if (jsonResult.status === "AUTHENTICATION_REQUIRED") {
                this.PingAuthN.handleAuthNflow({ flowResponse: jsonResult, body: "" })
                  .then(response => response.json())
                  .then(jsonResponse => {
                    let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResponse));
                    // We always get back a list of devices whether they have a default or not.
                    let devices = jsonResponse.devices.map((device) => {
                      return [device.type, device.id, device.target, device.name]; //NOTE: device.name will be undefined for all but mobile app devices. Device.target will exist for all but mobile app device.
                    });
                    this.setState({ deviceList: devices });

                    //Because we might have a default device in P1MFA.
                    if (jsonResponse.selectedDeviceRef) {
                      this.setLoginMethod(jsonResponse.selectedDeviceRef.id);
                    }

                    if (jsonResponse.status === "DEVICE_SELECTION_REQUIRED") {
                      this.toggleTab(tab);
                      //If we're below here it's because the user has a default device in P1MFA.
                    } else if (jsonResponse.status === "OTP_REQUIRED") {
                      this.toggleTab("3");
                    } else { // This assumes their default device response was PUSH_CONFIRMATION_WAITING
                      this.toggleTab("7");
                      this.handleSubmit("7");
                    }
                  });
              }
            })
            .catch(e => {
              console.error("handleAuthNflow exception:", e);
            });
          break;
        case "3":
          payload = this.state.deviceRef;
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, body: payload })
            .then(response => response.json())
            .then(jsonResult => {
              let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResult)); //TODO is there a better solution for this?
              if (jsonResult.status === "OTP_REQUIRED") {
                this.toggleTab(tab);
              } else if (jsonResult.status === "PUSH_CONFIRMATION_WAITING") {
                this.handleSubmit("7");
              }
            })
            .catch(e => {
              console.error("handleAuthNflow exception:", e);
            });
          break;
        case "4":
          //Tab 4 is forgot username, so send them to PF endpoint so we can demo Velocity templates.
          window.location.assign(data.pfAcctRecoveryURI);
          break;
        case "5":
          // We should never hit this case since PF is handling SSPR.
          // Need implementation if we move SSPR to authN API.
          this.toggleTab(tab);
          break;
        case "6":
          // Tab 6 is newly created for OTP submitted/success.
          payload = this.state.otp;
          this.toggleTab(tab);
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, body: payload })
            .then(response => response.json())
            .then(jsonResponse => {
              if (jsonResponse.status) { let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResponse)); }
              if (jsonResponse.status === "MFA_COMPLETED") {
                this.PingAuthN.handleAuthNflow({ flowResponse: jsonResponse, body: "" })
                  .then(response => response.json())
                  .then(jsonResult => {
                    let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResult)); //TODO is there a better solution for this?
                    if (jsonResult.status === "RESUME") {
                      this.PingAuthN.handleAuthNflow({ flowResponse: jsonResult })
                    }
                  });
              } else {
                // User got the OTP wrong. Try again.
                this.toggleTab("3");
              }
            })
            .catch(e => {
              console.error("handleAuthNflow exception:", e);
            });
          break;
        case "7":
          // Tab 7 is newly created for mobile push sent/success.
          this.toggleTab(tab);
          const polling = () => {
            this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse })
              .then(response => response.json())
              .then(jsonResponse => {
                let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResponse));
                if (jsonResponse.status === "MFA_COMPLETED") {
                  this.PingAuthN.handleAuthNflow({ flowResponse: jsonResponse, body: "" })
                    .then(response => response.json())
                    .then(jsonResult => {
                      let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResult)); //TODO is there a better solution for this?
                      if (jsonResult.status === "RESUME") {
                        window.clearInterval(pollingID);
                        this.PingAuthN.handleAuthNflow({ flowResponse: jsonResult })
                      }
                    });
                }
              })
              .catch(e => {
                console.error("handleAuthNflow exception:", e);
              });
          }
          let pollingID = window.setInterval(polling, 3000);
          break;
      }
    }
  }

  componentDidMount() {
    const rememberMe = this.Session.getCookie("rememberMe");
    if (rememberMe.length) { this.setState({ userName: rememberMe }); }
  }
  // END PING INTEGRATIONS

  render() {
    const closeBtn = <div />;
    return (
      <div>
        <Modal autoFocus={false} isOpen={this.state.isOpen} toggle={this.toggle.bind(this)} onClosed={this.onClosed.bind(this)} className="modal-login">
          <ModalHeader toggle={this.toggle.bind(this)} close={closeBtn}><img src={window._env_.PUBLIC_URL + "/images/logo.svg"} alt="logo" /></ModalHeader>
          <ModalBody>
            <form>
              <TabContent activeTab={this.state.activeTab}>
                <TabPane tabId="1">{/* Identifier first */}
                  <h4>{data.titles.welcome}</h4>
                  <FormGroup className="form-group-light">
                    <Label for="username">{data.form.fields.username.label}</Label>
                    <Input autoFocus={true} onChange={this.handleIDChange.bind(this)} autoComplete="off" type="text" name="username" id="username" placeholder={data.form.fields.username.placeholder} value={this.state.userName} /> 
                  </FormGroup>
                  <FormGroup className="form-group-light">
                    {/* <CustomInput type="checkbox" id="remember" label={data.form.fields.remember.label} /> */}
                  </FormGroup>
                  <div className="mb-3">
                    <Button type="button" color="primary" onClick={() => { this.handleSubmit('2'); }}>{data.form.buttons.next}</Button> {/* PING INTEGRATION see onClick function. */}
                  </div>
                  <div>
                    <Button type="button" color="link" size="sm" className="text-info pl-0" onClick={() => { this.handleSubmit('4'); }}>{data.form.buttons.reset}</Button> {/* PING INTEGRATION: see onclick function. */}
                  </div>
                </TabPane>
                <TabPane tabId="2">{/* Device/login selection. */}
                  <h4>{data.titles.login_method}</h4>
                  <FormGroup className={this.state.loginMethodFormGroupClass}>
                    <div>{/* BEGIN PING INTEGRATION: this switch/case could be reduced to a single line return, dynamically building the CustomInput tag. Demo 80/20 rule. */}
                      {this.state.deviceList.map((device, idx) => {
                        switch(device[0]) {
                          case "iPhone" :
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx+"_login_method_iPhone"} name="login_method" label={data.form.fields.login_method.options.faceid} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[3] ? device[3] : device[0]}</CustomInput>
                          break;
                          case "SMS":
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx + "_login_method_SMS"} name="login_method" label={data.form.fields.login_method.options.text} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[2]}</CustomInput>
                            break;
                          case "Email":
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx+"_login_method_Email"} name="login_method" label={data.form.fields.login_method.options.email} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[2]}</CustomInput>
                            break;
                          case "TOTP":
                            //This is currently not supported for BXF demos. No demand yet.
                            //I.e. Google Authenticator, MS Authenticator, etc.
                            // return <CustomInput key={idx} type="radio" did={device[1]} id={idx + "_login_method_TOTP"} name="login_method" label={data.form.fields.login_method.options.totp} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}<br />{device[2]}</CustomInput>
                            console.warn("Unsupported Device", "For this BX demo, we decided not to support TOTP devices; Google Authenticator, MS Authenticator, etc.");
                            break;
                        }
                      })}
                    </div>{/* END PING INTEGRATION */}
                  </FormGroup>
                  <div className="mb-4 text-center">
                    <Button type="button" color="primary" disabled={this.state.loginMethodUnset} onClick={() => { this.handleSubmit("3"); }}>{data.form.buttons.login}</Button>
                  </div>
                  <div className="text-center">
                    <Button type="button" color="link" size="sm" className="text-info" onClick={this.toggle.bind(this)}>{data.form.buttons.help}</Button>
                  </div>
                </TabPane>
                <TabPane tabId="3">{/* MFA sent, check phone msg. */}
                Using {this.state.loginMethod} at {this.state.loginTarget}.
                  <div className="mobile-loading" style={{ backgroundImage: `url(${window._env_.PUBLIC_URL}/images/login-device-outline.jpg)` }}>
                    <div className="spinner">
                      <FontAwesomeIcon icon={faCircleNotch} size="3x" className="fa-spin" />
                    </div>
                    <p>{data.mobile.loading}</p>
                  </div>
                  {/* BEGIN PING INTEGRATION: adding missing OTP entry text field. */}
                  {this.state.loginMethod !== "iPhone" &&
                    <FormGroup className="form-group-light">
                      <Label for="otp">{data.form.fields.otp.label}</Label>
                      <Input onChange={this.handleOTPChange.bind(this)} autoComplete="off" type="text" name="otp" id="otp" placeholder={data.form.fields.otp.placeholder} value={this.state.otp} />
                    </FormGroup>}
                  {this.state.loginMethod !== "iPhone" &&
                    <div className="mb-3">
                      <Button type="button" color="primary" onClick={() => { this.handleSubmit('6'); }}>{data.form.buttons.next}</Button> {/* PING INTEGRATION see onClick function. */}
                    </div>}
                  {/* END PING INTEGRATION */}
                  <div className="mt-4 text-center">
                    <Button type="button" color="link" size="sm" className="text-info" onClick={this.toggle.bind(this)}>{data.form.buttons.help}</Button>
                  </div>
                </TabPane>
                <TabPane tabId="4">{/* Recover userName. This is now handled by PF to demo Velocity templates. */}
                  <h4>{data.form.buttons.recover_username}</h4>
                  <FormGroup className="form-group-light">
                    <Label for="email">{data.form.fields.email.label}</Label>
                    <Input onChange={this.handleEmailChange.bind(this)} type="text" name="email" id="email" placeholder={data.form.fields.email.placeholder} />
                  </FormGroup>
                  <div className="mb-3">
                    <Button type="button" color="primary" onClick={() => { this.handleSubmit('5'); }}>{data.form.buttons.recover_username}</Button> {/* PING INTEGRATION: See onClick function. */}
                  </div>
                </TabPane>
                <TabPane tabId="5">{/* Not using TabPane 5. SSPR handled by PF. May use in the future. */}
                  <h4>{data.titles.recover_username_success}</h4>
                  <div className="mb-3 text-center">
                    <Button type="button" color="primary" onClick={() => { this.handleSubmit('1'); }}>{data.form.buttons.login}</Button>
                  </div>
                </TabPane>
                {/* BEGIN PING INTEGRATION: added TabPanes for OTP submission and mobile push success. */}
                <TabPane tabId="6">{/* OTP sent. */}
                  <h4>{data.titles.otp_success}</h4>
                  <div className="mt-4 text-center">
                    <Button type="button" color="link" size="sm" className="text-info" onClick={this.toggle.bind(this)}>{data.form.buttons.help}</Button>
                  </div>
                </TabPane>
                <TabPane tabId="7">{/* Mobile app push sent. */} {/* TODO jump to here for default device if mobile PUSH_CONFIRMATION_WAITING */}
                Using your {this.state.deviceName ? this.state.deviceName : this.state.loginMethod}.
                  <h4 data-toggle="tooltip" title="See what we did there?">{data.titles.mobile_success}</h4>
                  <div className="mt-4 text-center">
                    <Button type="button" color="link" size="sm" className="text-info" onClick={this.toggle.bind(this)}>{data.form.buttons.help}</Button>
                  </div>
                </TabPane>
                {/* END PING INTEGRATION */}
              </TabContent>
            </form>
          </ModalBody>
        </Modal>
        <ModalLoginPassword ref="modalLoginPassword" />
      </div>
    );
  }
}

export default ModalLogin;
