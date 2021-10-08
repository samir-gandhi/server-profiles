import React from 'react';
import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  CustomInput,
} from 'reactstrap';
import classNames from "classnames";

// Components
import NavbarMain from '../../components/NavbarMain';
import WelcomeBar from '../../components/WelcomeBar';
import FooterMain from '../../components/FooterMain';
import AccountsSubnav from '../../components/AccountsSubnav';
import AccountsDropdown from '../../components/AccountsDropdown';
import CardRewards from '../../components/CardRewards';
import Session from '../../components/Utils/Session'; /* PING INTEGRATION: */
import PingOAuth from '../../components/Integration/PingOAuth'; /* PING INTEGRATION: */
import PingData from '../../components/Integration/PingData'; /* PING INTEGRATION: */

// Data
import data from '../../data/profile-settings/communication-preferences.json';
import pingEndpoints from '../../data/ping-endpoints.json'; /* PING INTEGRATION: */

// Styles
import "../../styles/pages/profile-settings/communication-preferences.scss";

class CommunicationPreferences extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      sms: false,            /* PING INTEGRATION: */
      smsChecked: false,    /* PING INTEGRATION: */
      email: false,          /* PING INTEGRATION: */
      emailChecked: false,  /* PING INTEGRATION: */
      mail: false,             /* PING INTEGRATION: */
      mailChecked: false,    /* PING INTEGRATION: */
      consentId: "0"
    };

    this.showStep2 = this.showStep2.bind(this);
    this.close = this.close.bind(this);
    this.toggleConsent = this.toggleConsent.bind(this); /* PING INTEGRATION: */
    this.Session = new Session(); /* PING INTEGRATION: */
    this.PingOAuth = new PingOAuth(); /* PING INTEGRATION: */
    this.PingData = new PingData(); /* PING INTEGRATION: */
    this.consentDef = "share-comm-preferences"; /* PING INTEGRATION: */
  }

  showStep2() {
    /* BEGIN PING INTEGRATION */
    const consentID = this.Session.getAuthenticatedUserItem("commConsentId");
    if (consentID !== null && consentID !== "undefined") {
      const consent = { "sms": this.state.sms, "email": this.state.email, "homeAddress": this.state.mail };
      this.PingData.updateUserConsent(this.Session.getAuthenticatedUserItem("AT"), consent, consentID, this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          console.info("Updated user consent", JSON.stringify(consentData));
        })
        .catch(e => {
          console.error("UpdateUserConsents Exception", e)
        });
    } else { //Creating new consent record.
      const consent = { "sms": this.state.sms, "email": this.state.email, "homeAddress": this.state.mail };
      this.PingData.createUserConsent(this.Session.getAuthenticatedUserItem("AT"), consent, this.Session.getAuthenticatedUserItem("uid"), this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          console.info("Created user consent", JSON.stringify(consentData));
          //Add the consent ID to the app session so we know to update consents later.
          this.Session.setAuthenticatedUserItem("commConsentId", consentData.id);
        })
        .catch(e => {
          console.error("CreateUserConsents Exception", e)
        });
    } /* END PING INTEGRATION */
    this.setState({ step: 2 });
  }

  close() {
    this.setState({ step: 1 });
  }

  /* BEGIN PING INTEGRATION:  */
  //this function sets state of comm. pref. selected soley based on event obj passed in during onclick.
  // we extract the comm. type and consent pref. based on the substrings of the element ID. I.e "sms_yes".
  toggleConsent(event) {
    let consentState = {};
    let checkedState = {};
    const delimiterPos = event.target.id.indexOf("_");
    consentState[event.target.id.substring(0, delimiterPos)] = event.target.id.substring(delimiterPos + 1) === "yes" ? true : false;
    this.setState(consentState);
    checkedState[event.target.id.substring(0, delimiterPos) + "Checked"] = event.target.id.substring(delimiterPos + 1) === "yes" ? true : false;
    this.setState(checkedState);
  }
  /* END PING INTEGRATION:  */


  /* BEGIN PING INTEGRATION */
  componentDidMount() {
    // TODO collapse this if/else into a single block. Abstract the getToken and save to session so code isn't duplicated. Lame.
    if (this.Session.getAuthenticatedUserItem("AT")) {
      const token = this.Session.getAuthenticatedUserItem("AT");
      this.PingData.getUserConsents(token, this.Session.getAuthenticatedUserItem("uid"), this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          if (consentData.count > 0) {
            this.Session.setAuthenticatedUserItem("commConsentId", consentData._embedded.consents[0].id);
            this.setState({
              // TODO this is probably overkill having a checked version of the consent. You could probably infer from the consent value.
              sms: consentData._embedded.consents[0].data.sms,
              email: consentData._embedded.consents[0].data.email,
              mail: consentData._embedded.consents[0].data.homeAddress,
              smsChecked: consentData._embedded.consents[0].data.sms === true ? true : false,
              emailChecked: consentData._embedded.consents[0].data.email === true ? true : false,
              mailChecked: consentData._embedded.consents[0].data.homeAddress === true ? true : false
            });
          } else {
            console.debug("DEBUG", "No consents found on page load.");
          }
        })
        .catch(e => {
          console.error("GetUserConsents Exception", e)
        });
    } else {
      this.PingOAuth.getToken({ uid: this.Session.getAuthenticatedUserItem("uid"), scopes: 'urn:pingdirectory:consent' })
        .then(token => {
          this.Session.setAuthenticatedUserItem("AT", token); //for later reuse to reduce getToken calls.
          this.PingData.getUserConsents(token, this.Session.getAuthenticatedUserItem("uid"), this.consentDef)
            .then(response => response.json())
            .then(consentData => {
              if (consentData.count > 0) {
                this.Session.setAuthenticatedUserItem("commConsentId", consentData._embedded.consents[0].id);
                this.setState({
                  sms: consentData._embedded.consents[0].data.sms,
                  email: consentData._embedded.consents[0].data.email,
                  mail: consentData._embedded.consents[0].data.homeAddress,
                  smsChecked: consentData._embedded.consents[0].data.sms === true ? true : false,
                  emailChecked: consentData._embedded.consents[0].data.email === true ? true : false,
                  mailChecked: consentData._embedded.consents[0].data.homeAddress === true ? true : false
                });
              } else {
                console.debug("DEBUG", "No consents found on page load.");
              }
            })
            .catch(e => {
              console.error("GetUserConsents Exception", e)
            });
        })
        .catch(e => {
          console.error("GetToken Exception", e);
        });
    }
  }
  /* END PING INTEGRATION */

  render() {
    let commDetails, commType;
    return (
      <div className="accounts communication-preferences">
        <NavbarMain />
        <WelcomeBar firstName={this.Session.getAuthenticatedUserItem("firstName")} /> {/* PING INTEGRATION; added prop */}
        <Container>
          <div className="inner">
            <div className="sidebar">
              {
                Object.keys(data.subnav).map(key => {
                  return (
                    <AccountsSubnav key={data.subnav[key].title} subnav={data.subnav[key]} pingendpoints={pingEndpoints} />
                  );
                })
              }
              <CardRewards />
            </div>
            <div className="content">
              <div className="accounts-hdr">
                <h1>{data.title}</h1>
                <AccountsDropdown text={data.dropdown} />
              </div>
              {this.state.step === 1 &&
                <div className="module module-step1">
                  <h2>{data.steps[0].title}</h2>
                  <p>{data.steps[0].description}</p>
                  <h3>{data.steps[0].table_title}</h3>
                  <Form>
                    {
                      Object.keys(data.steps[0].communication_types).map(index => {
                        commDetails = data.steps[0].communication_types[index].name === "sms" ? this.Session.getAuthenticatedUserItem("mobile") : data.steps[0].communication_types[index].name === "email" ? this.Session.getAuthenticatedUserItem("email") : this.Session.getAuthenticatedUserItem("fullAddress");
                        commType = data.steps[0].communication_types[index].name;
                        return (
                          <>
                            <FormGroup key={index} className={classNames({ "gray": (index % 2) })}>
                              {/* PING INTEGRATION: modified label to display user data, and added onClicks to CustomInput */}
                              <Label for={data.steps[0].communication_types[index].name}>{data.steps[0].communication_types[index].label + '(' + commDetails + ')'}</Label>
                              <CustomInput onChange={(event) => this.toggleConsent(event)} type="radio" id={`${data.steps[0].communication_types[index].name}_yes`} name={data.steps[0].communication_types[index].name} checked={this.state[commType + "Checked"]} label="Yes" />
                              <CustomInput onChange={(event) => this.toggleConsent(event)} type="radio" id={`${data.steps[0].communication_types[index].name}_no`} name={data.steps[0].communication_types[index].name} checked={!this.state[commType + "Checked"]} label="No" />
                            </FormGroup>
                          </>
                        );
                      })
                    }
                    <FormGroup className="buttons submit-buttons">
                      <Button color="primary" onClick={this.showStep2}>Save</Button>
                      <a href={window._env_.PUBLIC_URL + "/banking/profile-settings"} className="text-info cancel">Cancel</a>
                    </FormGroup>
                  </Form>
                </div>
              }
              {this.state.step === 2 &&
                <div className="module module-step2">
                  <h2 className="confirmation">{data.steps[1].title}</h2>
                  <p>{data.steps[1].description}</p>
                  <h3>{data.steps[0].table_title}</h3>
                  <Form>
                    {
                      Object.keys(data.steps[1].communication_types).map(index => {
                        commDetails = data.steps[0].communication_types[index].name === "sms" ? this.Session.getAuthenticatedUserItem("mobile") : data.steps[0].communication_types[index].name === "email" ? this.Session.getAuthenticatedUserItem("email") : this.Session.getAuthenticatedUserItem("fullAddress");
                        commType = data.steps[0].communication_types[index].name;
                        return (
                          <>
                            <FormGroup key={index} className={classNames({ "gray": (index % 2) })}>
                              <Label for={data.steps[0].communication_types[index].name}>{data.steps[0].communication_types[index].label + '(' + commDetails + ')'}</Label>
                              <CustomInput type="radio" id={`${data.steps[0].communication_types[index].name}_yes`} name={data.steps[0].communication_types[index].name} checked={this.state[commType + "Checked"]} disabled label="Yes" />
                              <CustomInput type="radio" id={`${data.steps[0].communication_types[index].name}_no`} name={data.steps[0].communication_types[index].name} checked={!this.state[commType + "Checked"]} disabled label="No" />
                            </FormGroup>
                          </>
                        );
                      })
                    }
                    <div dangerouslySetInnerHTML={{ __html: data.steps[1].other_things }} />
                    <FormGroup className="buttons submit-buttons">
                      <Button color="primary" onClick={this.close}>{data.steps[1].btn_back}</Button>
                    </FormGroup>
                  </Form>
                </div>
              }
            </div>
          </div>
        </Container>
        <FooterMain />
      </div>
    )
  }
}
export default CommunicationPreferences