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

// Components
import FormPassword from '../../components/FormPassword';
import PingAuthN from '../Integration/PingAuthN' /* PING INTEGRATION */
import Session from '../Utils/Session' /* PING INTEGRATION: */

// External scripts
import { injectExternalScript } from '../Utils/injectExternalScript';

// Styles
import "./ModalLoginPassword.scss";

// Data
import data from './data.json';

class ModalLoginPassword extends React.Component {


  constructor() {
    super();
    this.state = {
      isOpen: false,
      activeTab: '1',
      loginMethodUnset: true,
      loginMethodFormGroupClass: '',
      deviceRef: "",                  /* PING INTEGRATION: Selected device's Id */
      deviceName: "",                 /* PING INTEGRATION: Device name if using mobile app. I.e. iPhone XS Max */
      loginMethod: "",                /* PING INTEGRATION: SMS, Email, iPhone, TOTP */
      loginTarget: "",                /* PING INTEGRATION: number or email of selected login method. */
      deviceList: [],                 /* PING INTEGRATION: */
      otp: "",                        /* PING INTEGRATION: */
      userName: "",                   /* PING INTEGRATION: */
      swaprods: "",                   /* PING INTEGRATION: */
      loginError: false,              /* PING INTEGRATION: */
      loginErrorMsg: "",              /* PING INTEGRATION: */
      rememberMe: "",                 /* PING INTEGRATION: */
      deviceProfile: {}               /* PING INTEGRATION: */
    };
    this.PingAuthN = new PingAuthN(); /* PING INTEGRATION: */
    this.Session = new Session();     /* PING INTEGRATION: */
    this.buildDeviceProfile = this.buildDeviceProfile.bind(this); /* PING INTEGRATION: */
    this.deviceProfileString = ''; /* PING INTEGRATION: */
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
      loginMethodFormGroupClass: ''
    });
  }
  toggle(userName) {
    this.setState({
      isOpen: !this.state.isOpen,
      userName: userName
    });
  }
  toggleTab(tab) {
    /* BEGIN PING INTEGRATION: We're letting PF handle SSPR to demo Velocity templates. */
    if (tab === '4') {
      window.location.assign(data.pfAcctRecoveryURI);
    } else if (tab === '5') {
      window.location.assign(data.pfPwdResetURI);
    } else {
      /* END PING INTEGRATION */
      this.setState({
        activeTab: tab
      });
      //Hack for getting focus on the OTP field.... because reactstrap. :-(
      if (tab === "3") { document.getElementById("otp").focus(); }
    }
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

  /* BEGIN PING INTEGRATION: */
  // Controlled input for the Remember Me checkbox.
  //If they check it, we save their username to a cookie for the next time they log in.
  //ModalLogin.js will check for cookies and prepop the username field.
  handleRememberMeChange() {
    this.setState((prevState) => {
      if (prevState.rememberMe) {
        document.cookie = "rememberMe=";
      } else {
        document.cookie = "rememberMe=" + this.state.userName;
      }
      return { rememberMe: !prevState.rememberMe };
    });
  }

  // This is used as a callback function to the child component FormPassword.
  handlePswdChange(event) {
    this.setState({ swaprods: event.target.value }, () => {
    });
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

  //When user clicks "Next".
  // Handler for various TabPane UIs.
  // TODO T3 used numeric IDs for the TabPanes in render(). With our handler, 
  // it would be easier to visually map in the code if they had text IDs related to the UI of the TabPane. I.e. "IDF", "Devices", etc.
  handleSubmit(tab) {
    // Clear error state for next pass through.
    this.setState({
      loginError: false,
      loginErrorMsg: ""
    });
    const pswd = tab === '2' ? this.state.swaprods : "WTF?"; //TODO Do we care about the tab param here? Toss?
    const cachedFlowResponse = JSON.parse(this.Session.getAuthenticatedUserItem("flowResponse"));

    if (pswd) { //TODO do we need this test anymore?
      let data = "";

      switch (tab) { // Each case corresponds to a tab pane in the UI.
        case "1":
          // Username/password form. This is the default state for the component. Will probably never be called from here.
          this.toggleTab("1");
          break;
        case "2":
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, swaprods: this.state.swaprods, rememberMe: this.state.rememberMe })
            .then(response => response.json())
            .then(jsonResults => {
              //We only want to cache the flow response if it has a status. Otherwise it's an error of some kind.
              if (jsonResults.status) {let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResults));}
              
              if (jsonResults.status === "RESUME") {
                this.PingAuthN.handleAuthNflow({ flowResponse: jsonResults });//Don't need to do anything more than call handleAuthNFlow(). RESUME always results in a redireect to the TargetResource.
              } else if (jsonResults.status === "DEVICE_PROFILE_REQUIRED") {
                console.info("ModalLoginPassword.js","PingOne Risk eval needs device profile.");
                window.profileDevice(this.buildDeviceProfile);
                //BEGIN DELAY: P1Risk device profiling scripts take just long enough to run that we were trying to send the profile to the authN API before we had it.
                let intervalId = setInterval(() => {
                  this.PingAuthN.handleAuthNflow({ flowResponse: jsonResults, body: this.deviceProfileString })
                    .then(response => response.json())
                    .then(jsonResponse => {
                      let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResponse));
                      if (jsonResponse.status === "RESUME") {
                        clearTimeout(intervalId);
                        this.PingAuthN.handleAuthNflow({ flowResponse: jsonResponse });//Don't need to do anything more than call handleAuthNFlow(). RESUME always results in a redireect to the TargetResource.
                      } else if (jsonResponse.status === "AUTHENTICATION_REQUIRED") {
                        clearTimeout(intervalId);
                        this.PingAuthN.handleAuthNflow({ flowResponse: jsonResponse, body: "" })
                          .then(response => response.json())
                          .then(jsonResponse => {
                            let success = this.Session.setAuthenticatedUserItem("flowResponse", JSON.stringify(jsonResponse));
                            // We always get back a list of devices whether they have a default or not.
                            let devices = jsonResponse.devices.map((device) => {
                              return [device.type, device.id, device.target, device.name];
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
                    });
                }, 1000, jsonResults, this.deviceProfileString);
                //END DELAY.
              } else if (jsonResults.code === "VALIDATION_ERROR") {
                console.info("Validation Error", jsonResults.details[0].userMessage);
                this.setState({
                  loginError: true,
                  loginErrorMsg: jsonResults.details[0].userMessage
                });
              } else {
                throw new Error("Flow Status Exception: Unexpected status."); //TODO This is probably a corner case, but we need to use ModalError.js for this.
              }
            })
            .catch(e => {
              console.error("handleAuthNFlow() Exception:", e);
            });
          break;
        case "3":
          data = this.state.deviceRef;
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, body: data })
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
          // We should never hit this case since PF is handling SSPR.
          // Need implementation if we move SSPR to authN API.
          // @see this.toggleTab(tab);
          break;
        case "5":
          // We should never hit this case since PF is handling SSPR.
          // Need implementation if we move SSPR to authN API.
          // @see this.toggleTab(tab);
          break;
        case "6":
          // Tab 6 is newly created for OTP submitted/success.
          data = this.state.otp;
          this.toggleTab(tab);
          this.PingAuthN.handleAuthNflow({ flowResponse: cachedFlowResponse, body: data })
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
        case "8":
          //TODO  need implementation? Do we ever get here? or is this another case handled by PF UIs?
          break;
      }
      
    }
  }

  // Callback for P1 Risk profiling scripts.
  // When P1 Risk profiles the user's device, it will call this method passing the raw device profile.
  buildDeviceProfile(deviceComponents) {
    const formattedProfile = window.transformComponentsToDeviceProfile(deviceComponents)
    this.deviceProfileString = JSON.stringify(formattedProfile);
  }

  componentDidMount() {
    const rememberMe = this.Session.getCookie("rememberMe");
    if (rememberMe.length) {
      this.setState({ rememberMe: true });
    }
    // Appending scripts for PingOne Risk device profiling.
    injectExternalScript("/app/scripts/fingerprint2-2.1.4.min.js");
    injectExternalScript("/app/scripts/pingone-risk-management-profiling.js");
  }
  /* END PING INTEGRATION: */

  render() {
    const closeBtn = <div />;
    return (
      <div>
        <Modal autoFocus={false} isOpen={this.state.isOpen} toggle={this.toggle.bind(this)} onClosed={this.onClosed.bind(this)} className="modal-login">
          <ModalHeader toggle={this.toggle.bind(this)} close={closeBtn}><img src={window._env_.PUBLIC_URL + "/images/logo.svg"} alt="logo" /></ModalHeader>
          <ModalBody>
            <form>
              <TabContent activeTab={this.state.activeTab}>
                <TabPane tabId="1"> {/* Username/password */}
                  <h4>{data.titles.welcome}</h4>
                  {this.state.loginError && <span style={{ color: 'red' }}>{this.state.loginErrorMsg}</span>} {/* PING INTEGRATION */}
                  <FormGroup className="form-group-light">
                    <Label for="username">{data.form.fields.username.label}</Label>
                    <Input autoComplete="off" type="text" name="username" readOnly id="username" value={this.state.userName} placeholder={data.form.fields.username.placeholder} />
                  </FormGroup>
                  <FormGroup className="form-group-light">
                    <Label for="password">{data.form.fields.password.label}</Label>
                    <Input autoFocus={true} autoComplete="off" type="password" onChange={this.handlePswdChange.bind(this)} name="password" id="password" placeholder={data.form.fields.password.placeholder} />
                  </FormGroup>
                  {/* <FormPassword setPassword={this.handlePswdChange} name="password" label={data.form.fields.password.label} placeholder={data.form.fields.password.placeholder} /> */}
                  <FormGroup className="form-group-light">
                    <CustomInput onChange={this.handleRememberMeChange.bind(this)} type="checkbox" id="remember" label={data.form.fields.remember.label} checked={this.state.rememberMe} />
                  </FormGroup>
                  <div className="mb-3">
                    <Button type="button" color="primary" onClick={() => { this.handleSubmit('2') }}>{data.form.buttons.next}</Button>
                  </div>
                  <div>
                    <Button type="button" color="link" size="sm" className="text-info pl-0" onClick={() => { this.toggleTab('4'); }}>{data.form.buttons.reset}</Button>
                  </div>
                  <div>
                    <Button type="button" color="link" size="sm" className="text-info pl-0" onClick={() => { this.toggleTab('5'); }}>{data.form.buttons.reset_password}</Button>
                  </div>
                </TabPane>
                <TabPane tabId="2"> {/* Device/login selection. */}
                  <h4>{data.titles.login_method}</h4>
                  <FormGroup className={this.state.loginMethodFormGroupClass}>
                    <div>{/* BEGIN PING INTEGRATION: this switch/case could be reduced to a single line return, dynamically building the CustomInput tag. Demo 80/20 rule. */}
                      {this.state.deviceList.map((device, idx) => {
                        switch (device[0]) {
                          case "iPhone":
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx + "_login_method_iPhone"} name="login_method" label={data.form.fields.login_method.options.faceid} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[3]}</CustomInput>
                            break;
                          case "SMS":
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx + "_login_method_SMS"} name="login_method" label={data.form.fields.login_method.options.text} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[2]}</CustomInput>
                            break;
                          case "Email":
                            return <CustomInput key={idx} type="radio" did={device[1]} id={idx + "_login_method_Email"} name="login_method" label={data.form.fields.login_method.options.email} className="form-check-inline" onClick={this.setLoginMethod.bind(this)}><br />{device[2]}</CustomInput>
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
                    <Button type="button" color="primary" disabled={this.state.loginMethodUnset} onClick={() => { this.handleSubmit('3'); }}>{data.form.buttons.login}</Button>
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
                    <Button type="button" color="primary" onClick={() => { this.handleSubmit('5'); }}>{data.form.buttons.recover_username}</Button>{/* PING INTEGRATION: See onClick function. */}
                  </div>
                </TabPane>
                <TabPane tabId="5">{/* Not using TabPane 5. SSPR handled by PF. May use in the future. */}
                  <h4>{data.form.buttons.recover_password}</h4>
                  <FormGroup className="form-group-light">
                    <Label for="email">{data.form.fields.email.label}</Label>
                    <Input type="text" name="email" id="email" placeholder={data.form.fields.email.placeholder} />
                  </FormGroup>
                  <div className="mb-3">
                    <Button type="button" color="primary" onClick={() => { this.toggleTab('6'); }}>{data.form.buttons.recover_password}</Button>
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
                <TabPane tabId="8"> {/* This used to be tabId 6 in the original T3 supplied UI. Just FYI for historical reference. */}
                  <h4>{data.titles.recover_username_success}</h4>
                  <div className="mb-3 text-center">
                    <Button type="button" color="primary" onClick={() => { this.toggleTab('1'); }}>{data.form.buttons.login}</Button>
                  </div>
                </TabPane>
              </TabContent>
            </form>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalLoginPassword;
