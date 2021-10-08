import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  CustomInput
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
import { Link } from 'react-router-dom' /* PING INTEGRATION: */

// Data
import data from '../../data/profile-settings/privacy-security.json';
import pingEndpoints from '../../data/ping-endpoints.json'; /* PING INTEGRATION: */

// Styles
import "../../styles/pages/profile-settings/privacy-security.scss";

class PrivacySecurity extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      isOpen: false,
      isModalOpen: false,
      anywealthadvisor: false,           /* PING INTEGRATION: Whether they are giving consent to the Advisor */
      acct_0: 0,                         /* PING INTEGRATION: Will store List of the user's 3 existing accounts */
      acct_1: 0,                         /* PING INTEGRATION: The value will be the acct ID, updated in componentDidMount() */
      acct_2: 0,                         /* PING INTEGRATION: The IDs are later correlated to consentedAccts. */
      consentedAccts: [],                /* PING INTEGRATION: the acct IDs for which have been given consent. */
      consentId: "0"                       /* PING INTEGRATION: Id from the user's consent record, if one exists. */
    };

    this.showStep1 = this.showStep1.bind(this);
    this.showStep2 = this.showStep2.bind(this);
    this.close = this.close.bind(this);
    this.toggle = this.toggle.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.Session = new Session(); /* PING INTEGRATION: */
    this.PingOAuth = new PingOAuth(); /* PING INTEGRATION: */
    this.PingData = new PingData(); /* PING INTEGRATION: */
    this.consentDef = "share-account-balances"; /* PING INTEGRATION: */
  }

  showStep1() {
    this.setState({ step: 1 });
  }

  showStep2() {
    /* BEGIN PING INTEGRATION */
    const consentID = this.Session.getAuthenticatedUserItem("acctsConsentId");
    if (consentID !== null && consentID !== "undefined") {//User has a consent record, so update.
      console.info("Consent ID", this.state.consentId);
      this.PingData.updateUserConsent(this.Session.getAuthenticatedUserItem("AT"), this.state.consentedAccts, consentID, this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          console.info("Updated user consent", JSON.stringify(consentData));
        })
        .catch(e => {
          console.error("UpdateUserConsents Exception", e)
        });
    } else { //User has no consent record, so create.
      console.info("Consent ID", this.state.consentId);
      this.PingData.createUserConsent(this.Session.getAuthenticatedUserItem("AT"), this.state.consentedAccts, this.Session.getAuthenticatedUserItem("uid"), this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          console.info("Created user consent", JSON.stringify(consentData));
          //Add the consent ID to the app session so we know to update consents later.
          this.Session.setAuthenticatedUserItem("acctsConsentId", consentData.id);
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

  toggle(event) {
    //Making sure we only open on yes and close on no and only if in the opposite state.
    if (event.target.id.includes("yes") && !this.state.isOpen) {
      this.setState({
        isOpen: !this.state.isOpen,
        anywealthadvisor: true
      });
    }
    if (event.target.id.includes("no") && this.state.isOpen) {
      this.setState({
        isOpen: !this.state.isOpen,
        anywealthadvisor: false,
        consentedAccts: []
      });
    }

  }

  toggleModal(evt) {
    const partnerArrIdx = evt.target.id;
    this.setState({
      isModalOpen: !this.state.isModalOpen,
      partnerLearnMoreModal: partnerArrIdx
    });
  }

  toggeAccount(index, acctId) {
    const consentedAcctsArr = this.state.consentedAccts;
    const acctPos = consentedAcctsArr.indexOf(acctId)
    if (acctPos > -1) {// The acct clicked is already consented so we are removing consent.
      consentedAcctsArr.splice(acctPos, 1)
    } else {// The acct clicked was not consented so we are adding consent.
      consentedAcctsArr.push(acctId);
    }
    this.setState({ consentedAccts: consentedAcctsArr });
  }
  /* END PING INTEGRATION:  */


  /* BEGIN PING INTEGRATION */
  componentDidMount() {
    let acctState = [];
    let acctIDsArr = [];
    let consentState = [];
    let consentedAcctsArr = [];
    // Get the user's existing bank account IDs.
    
    let acctIDs = this.Session.getAuthenticatedUserItem("accts");
    acctIDsArr = acctIDs.split(",");

    //Update state with user's existing 3 bank account IDs
    acctIDsArr.forEach((acctId, index) => {
      acctState["acct_" + index] = parseInt(acctId);
    });
    this.setState(acctState);

    if (this.Session.getAuthenticatedUserItem("AT")) {
      // TODO we should move the following code into a method. Duplicating it below based on whether we have a token or not is bad design. Error prone maintenance.
      const token = this.Session.getAuthenticatedUserItem("AT");
      this.PingData.getUserConsents(token, this.Session.getAuthenticatedUserItem("uid"), this.consentDef)
        .then(response => response.json())
        .then(consentData => {
          console.info("Got user consents", JSON.stringify(consentData));
          if (consentData.count > 0) { //Do we have a consent record? (There is no status if no record)
            this.Session.setAuthenticatedUserItem("acctsConsentId", consentData._embedded.consents[0].id);
            this.setState({
              anywealthadvisor: consentData._embedded.consents[0].data["share-balance"].length ? true : false,
            });
            //loop over share-balance array updating account consent state.
            // This loop ensures we handle n number of accts on someones record to avoid complexity, 
            // in case we get more than 3 accts in the future. (We dont control the OpenBanking Mock API). 
            // Otherwise the loop would need to exit after array[2].
            consentedAcctsArr = consentData._embedded.consents[0].data["share-balance"];
            consentedAcctsArr.forEach((acctId, index) => {
              //If the acct ID exists, then they've given consent. These state items are later correlated with the existing acct IDs already set.
              consentState.push(acctId);

            });
            this.setState({
              consentedAccts: consentState,
              isOpen: consentData._embedded.consents[0].status === "accepted" ? true : false
            });
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
              console.info("Got user consents", JSON.stringify(consentData));
              if (consentData.count > 0) { //Do we have a consent record? (There is no status if no record)
                this.Session.setAuthenticatedUserItem("acctsConsentId", consentData._embedded.consents[0].id);
                this.setState({
                  anywealthadvisor: consentData._embedded.consents[0].data["share-balance"].length ? true : false,
                });
                //loop over share-balance array updating account consent state.
                // This loop ensures we handle n number of accts on someones record to avoid complexity, 
                // in case we get more than 3 accts in the future. (We dont control the OpenBanking Mock API). 
                // Otherwise the loop would need to exit after array[2].
                consentedAcctsArr = consentData._embedded.consents[0].data["share-balance"];
                consentedAcctsArr.forEach((acctId, index) => {
                  //If the acct ID exists, then they've given consent. These state items are later correlated with the existing acct IDs already set.
                  consentState.push(acctId);

                });
                this.setState({
                  consentedAccts: consentState,
                  isOpen: consentData._embedded.consents[0].status === "accepted" ? true : false
                });
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
  /* END PING INTEGRATION: */

  render() {
    const partner1 = data.steps[0].partners[0];
    const partner2 = data.steps[0].partners[1];
    const partner3 = data.steps[0].partners[2];
    const partnerModalArr = [partner1.modal, partner2.modal, partner3.modal]; /* PING INTEGRATION: */
    let isChecked = false; /* PING INTEGRATION: */
    // let consentedAcctsArr = [];

    return (
      <div className="accounts privacy-security">
        <NavbarMain />
        <WelcomeBar firstName={this.Session.getAuthenticatedUserItem("firstName")} /> {/* PING INTEGRATION: added passing of firstName prop. */}
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
              <div className="module">
                {this.state.step === 1 &&
                  <div className="edit">
                    <h2>{data.steps[0].title}</h2>
                    <p>{data.steps[0].description}</p>
                    <h3>{data.steps[0].table_title}</h3>
                    <Form className="edit">
                      <Container>
                        <div>
                          <Row>
                            <Col md={12} lg={4}><img src={window._env_.PUBLIC_URL + partner1.logo} alt="" /></Col>
                            <Col md={12} lg={4}>
                              <CustomInput type="radio" id={`${partner1.name}_yes`} name={partner1.name} label="Yes" />
                              <CustomInput type="radio" id={`${partner1.name}_no`} readOnly checked name={partner1.name} label="No" />
                            </Col>
                            <Col md={12} lg={4}><a href="#" id="0" className="partner-overlay" onClick={this.toggleModal}>{partner1.learn_more}</a></Col>{/* TODO add back Learn More modal popup */}
                          </Row>
                        </div>
                        <div>
                          <Row className="gray">
                            <Col md={12} lg={4}><img src={window._env_.PUBLIC_URL + partner2.logo} alt="" /></Col>
                            <Col md={12} lg={4}>
                              <CustomInput type="radio" id={`${partner2.name}_yes`} name={partner2.name} label="Yes" />
                              <CustomInput type="radio" id={`${partner2.name}_no`} readOnly checked name={partner2.name} label="No" />
                            </Col>
                          <Col md={12} lg={4}><a href="#" id="1" className="partner-overlay" onClick={this.toggleModal}>{partner2.learn_more}</a></Col>{/* TODO add back Learn More modal popup */}
                          </Row>
                        </div>
                        {/* PING INTEGRATION: This block "partner3" is only partner block modified for demos. The others are static.  */}
                        <div>
                          <Row>
                            <Col md={12} lg={4}><img src={window._env_.PUBLIC_URL + partner3.logo} alt="" /></Col>
                            <Col md={12} lg={4}>
                              <CustomInput type="radio" id={`${partner3.name}_yes`} checked={this.state[partner3.name]} name={partner3.name} label="Yes" onClick={this.toggle} />
                              <CustomInput type="radio" id={`${partner3.name}_no`} checked={!this.state[partner3.name]} name={partner3.name} label="No" onClick={this.toggle} />
                            </Col>
                          <Col md={12} lg={4}><a href="#" id="2" className="partner-overlay" onClick={this.toggleModal}>{partner3.learn_more}</a></Col>
                          </Row>
                          <Row className={classNames("accounts-access", { "visible": this.state.isOpen })}>
                            <Col>
                              <p>{partner3.permissions_hdr}</p>
                              {
                                Object.keys(partner3.permissions).map(index2 => {
                                  isChecked = this.state.consentedAccts.indexOf(this.state["acct_" + index2]) > -1 ? true : false;
                                  return (
                                    <FormGroup key={index2} check>
                                      <Label className="custom-checkbox" check>
                                        <Input type="checkbox" onClick={() => this.toggeAccount(index2, this.state["acct_" + index2])} checked={isChecked} /> {partner3.permissions[index2].label}
                                        <span className="checkmark"><span></span></span>
                                      </Label>
                                    </FormGroup>
                                  )
                                })
                              }
                            </Col>
                          </Row>
                          {this.state.isModalOpen &&
                            <div className="psmodal psmodal-anywealthadvisor">
                              <a href="#" className="close" onClick={this.toggleModal}><span className="sr-only">Close</span></a>
                          <div dangerouslySetInnerHTML={{ __html: partnerModalArr[this.state.partnerLearnMoreModal] }} />
                            </div>
                          }
                        </div>

                        <Row>
                          <Col>
                            <FormGroup className="buttons submit-buttons">
                              <Button color="primary" onClick={this.showStep2}>{data.steps[0].btn_save}</Button>
                              {/* <a href="/banking/profile-settings" className="text-info cancel">{data.steps[0].btn_cancel}</a> */}
                              <Link to="/banking/profile-settings" className="text-info cancel">{data.steps[0].btn_cancel}</Link>
                            </FormGroup>
                          </Col>
                        </Row>
                      </Container>
                    </Form>
                  </div>
                }
                {this.state.step === 2 &&
                  <div className="confirmation">
                    <h3>{data.steps[1].title}</h3>
                    <p>{data.steps[1].description}</p>
                    {
                      Object.keys(data.steps[1].partners).map(index => {
                        return (
                          <>
                            <p className="form-header">{data.steps[1].partners[index].title}</p>
                            <Form>
                              {
                                Object.keys(data.steps[1].partners[index].permissions).map(index2 => {
                                  const permission = data.steps[1].partners[index].permissions[index2];
                                  isChecked = this.state.consentedAccts.indexOf(this.state["acct_" + index2]) > -1 ? true : false;
                                  return (
                                    <FormGroup key={index2} check>
                                      <Label className="custom-checkbox" check>
                                        <Input type="checkbox" checked={isChecked} disabled /> {permission.label}
                                        <span className="checkmark"><span></span></span>
                                      </Label>
                                    </FormGroup>
                                  )
                                })
                              }
                            </Form>
                            <div className="anywealthadvisor">
                              <p>{data.steps[1].partners[index].banner}</p>
                              <Button href={data.steps[1].partners[index].cta_destination}>{data.steps[1].partners[index].cta_text}</Button>
                            </div>
                          </>
                        );
                      })
                    }
                    <div dangerouslySetInnerHTML={{ __html: data.steps[1].other_things }} />
                    <FormGroup className="buttons submit-buttons">
                      <Button color="primary" onClick={this.showStep1}>{data.steps[1].btn_back}</Button>
                    </FormGroup>
                  </div>
                }
              </div>
            </div>
          </div>
        </Container>
        <FooterMain />
      </div>
    )
  }
}
export default PrivacySecurity
