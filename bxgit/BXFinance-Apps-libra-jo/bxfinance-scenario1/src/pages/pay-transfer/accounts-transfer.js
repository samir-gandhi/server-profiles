import React from 'react'
import {
  Container,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col
} from 'reactstrap';

// Components
import NavbarMain from '../../components/NavbarMain';
import WelcomeBar from '../../components/WelcomeBar';
import FooterMain from '../../components/FooterMain';
import AccountsSubnav from '../../components/AccountsSubnav';
import AccountsDropdown from '../../components/AccountsDropdown';
import CardRewards from '../../components/CardRewards';
import Session from '../../components/Utils/Session'; /* PING INTEGRATION: */
import OpenBanking from '../../components/Integration/OpenBanking'; /* PING INTEGRATION: */
import { Link } from 'react-router-dom' /* PING INTEGRATION: */

// Data
import data from '../../data/accounts-transfer.json';

// Styles
import "../../styles/pages/pay-transfer/accounts-transfer.scss";

class AccountsTransfer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      xfrAmount: '0', /* PING INTEGRATION: */
      xfrFailMsg: ''
    };

    this.showStep2 = this.showStep2.bind(this);
    this.showStep3 = this.showStep3.bind(this);
    this.Session = new Session(); /* PING INTEGRATION: */
    this.OpenBanking = new OpenBanking(); /* PING INTEGRATION: */
  }

  //Formatting dollar amounts to currency for confirmation or deny screens.
  //Defaulting to USA for now.
  //TODO turn into call to GeoLocate component to format according to user's locale.
  currencyFormat = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  showStep2() {
    const status = this.state.xfrAmount < 1000 ? "approved" : this.state.xfrAmount >= 1000 && this.state.xfrAmount <= 100000 ? "confirm" : "denied";
    switch (status) {
      case "approved":
        // TODO need error handling and checking status of transfermoney response.
        //TODO since using token from session, need ability to get new token if expired.
        this.OpenBanking.transferMoney(this.state.xfrAmount, this.Session.getAuthenticatedUserItem("AT"))
          .then(response => response.json())
          .then(jsonData => {
            if (jsonData.status === "Money Transferred!") {
              this.setState({ step: 3 });
            } else {
              this.setState({ step: 4 }); //TODO this needs to be error modal.
            }
          })
          .catch(error => {
            console.error("TransferMoney Exception", error);
          });
        break;
      case "confirm":
        this.setState({ step: 2 });
        this.OpenBanking.transferMoney(this.state.xfrAmount, this.Session.getAuthenticatedUserItem("AT"))
          .then(response => response.json())
          .then(jsonData => {
            if (jsonData.status === "Money Transferred!") {
              this.setState({ step: 3 });
            } else {
              this.setState({ 
                xfrFailMsg: "We did not receive your transaction approval for:",
                step: 4 
              }); //TODO this needs to be error modal.
            }
          })
          .catch(error => {
            console.error("TransferMoney Exception", error);
          });
        break;
      default: /* Denied */
        this.setState({ 
          xfrFailMsg: "You have exceeded a transfer limit from:",
          step: 4 
        });
    }
  }

  showStep3() {
    /* PING INTEGRATION: commented out. Nothing to do in this case. Just waiting for API response to kick in. "Confirm" case above. */
    //this.setState({ step: 3 });
  }

  /* BEGIN PING INTEGRATION: */
  handleAmountChange(event) {
    let amt = event.target.value;
    amt = amt.replace(/,/g, '');
    const dollars = parseFloat(amt).toFixed(2);
    this.setState({ xfrAmount: dollars });
  }
  /* END PING INTEGRATION: */

  render() {
    return (
      <div className="accounts accounts-transfer">
        <NavbarMain />
        <WelcomeBar firstName={this.Session.getAuthenticatedUserItem("firstName")} />
        <Container>
          <div className="inner">
            <div className="sidebar">
              {
                Object.keys(data.subnav).map(key => {
                  return (
                    <AccountsSubnav key={data.subnav[key].title} subnav={data.subnav[key]} />
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
                <div className="transfer-step transfer-step1">
                  <Form>
                    <Row>
                      <Col lg={6}>
                        <FormGroup>
                          <Label for="account_from">{data.form.fields.transfer_from.label}</Label>
                          <Input type="select" name="account_from" id="account_from">
                            <option>{data.form.fields.transfer_from.placeholder}</option>
                            {
                              Object.keys(data.form.fields.transfer_from.options).map(key => {
                                return (
                                  <option key={data.form.fields.transfer_from.options[key]}>{data.form.fields.transfer_from.options[key]}</option>
                                );
                              })
                            }
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col lg={6}>
                        <FormGroup>
                          <Label for="account_to">{data.form.fields.transfer_to.label}</Label>
                          <Input type="select" name="account_to" id="account_to">
                            <option>{data.form.fields.transfer_to.placeholder}</option>
                            {
                              Object.keys(data.form.fields.transfer_to.options).map(key => {
                                return (
                                  <option key={data.form.fields.transfer_to.options[key]}>{data.form.fields.transfer_to.options[key]}</option>
                                );
                              })
                            }
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col lg={6}>
                        <FormGroup>
                          <Label for="amount">Amount</Label>
                          <div className="input-currency">
                            <Input onChange={this.handleAmountChange.bind(this)} type="text" name="amount" id="amount" />
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row className="submit-buttons">
                      <Col md={12} className="text-right">
                        {/* <a href={window._env_.PUBLIC_URL} className="text-info cancel">{data.form.buttons.cancel.label}</a> */}
                        <Link to="/banking" className="text-info cancel">{data.form.buttons.cancel.label}</Link>
                        <Button color="primary" className="start-transfer" onClick={this.showStep2}>{data.form.buttons.start_transfer.label}</Button> {/* PING INTEGRATION: onClick handler here */}
                      </Col>
                    </Row>
                  </Form>
                </div>
              }

              {this.state.step === 2 &&
                <div className="transfer-step transfer-step2">
                  <h2>Okay, let&rsquo;s confirm:</h2>
                  <div className="table">
                    <div className="table-col">
                      <h3>Transfer from:</h3>
                      <p>BXChecking (...4458)</p>
                    </div>
                    <div className="table-col">
                      <h3>Transfer to:</h3>
                      <p>AnyBank (...5661)</p>
                    </div>
                    <div className="table-col">
                      <h3>Amount:</h3>
                      <p>{this.currencyFormat(this.state.xfrAmount)}</p>
                    </div>
                  </div>
                  <div className="app-approval-banner">
                    <img src={window._env_.PUBLIC_URL + "/images/icons/phone.jpg"} className="img-phone" alt="phone" />
                    <h3>Requires your approval:</h3>
                    <p>This transaction will take place after you approve it using your BXFinance app on iPhone. <a>What is this?</a></p>
                    <img src={window._env_.PUBLIC_URL + "/images/app-store-logos.svg"} className="app-store-logos" alt='App Store'/>
                  </div>
                  <Form>
                    <Row className="submit-buttons">
                      <Col md={12} className="text-right">
                        <a href={window._env_.PUBLIC_URL} className="text-info cancel">{data.form.buttons.cancel.label}</a>
                        <Button color="primary" className="start-transfer" onClick={this.showStep3}>{data.form.buttons.pending_transfer.label}</Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              }

              {this.state.step === 3 &&
                <div className="transfer-step transfer-step3">
                  <h2>Transfer Confirmed</h2>
                  <div className="table">
                    <div className="table-col table-col-67">
                      <h3>You have initiated a transfer from:</h3>
                      <p>BXChecking (...4458) to BXSavings (...5661)</p>
                    </div>
                    <div className="table-col table-col-33">
                      <h3>Amount:</h3>
                      <p>{this.currencyFormat(this.state.xfrAmount)}</p>
                    </div>
                  </div>
                  <p>This transaction will take place in 1-2 business days.</p>
                  <p>Transaction number:<br />{Math.floor(Math.random() * 100000)}</p>

                  <Form>
                    <Row className="submit-buttons">
                      <Col md={12} className="text-right">
                        {/* <a href={window._env_.PUBLIC_URL} className="text-link cancel">{data.form.buttons.close.label}</a> */}
                        <Link to="/banking/pay-and-transfer" className="text-link cancel">{data.form.buttons.close.label}</Link>
                        <Button color="primary" className="start-transfer" onClick={this.showStep1}>{data.form.buttons.start_new_transfer.label}</Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              }

              {/* BEGIN PING INTEGRATION: Transfer denied display we never got. */}
              {this.state.step === 4 &&
                <div className="transfer-step transfer-step3">
                  <h2>Transfer Denied</h2>
                  <div className="table">
                    <div className="table-col table-col-67">
                    <h3>{this.state.xfrFailMsg}</h3><p>BXChecking (...4458) to BXSavings (...5661)</p>
                    </div>
                    <div className="table-col table-col-33">
                      <h3>Amount:</h3>
                      <p style={{ color: '#ff0000' }}>{this.currencyFormat(this.state.xfrAmount)}</p>
                    </div>
                  </div>
                  <p>Please contact a banking representative for transfers of this amount.</p>
                  <p>Transaction number:<br />{Math.floor(Math.random() * 100000000)}</p>

                  <Form>
                    <Row className="submit-buttons">
                      <Col md={12} className="text-right">
                        {/* <a href={window._env_.PUBLIC_URL} className="text-link cancel">{data.form.buttons.close.label}</a> */}
                        <Link to="/banking/pay-and-transfer" className="text-link cancel">{data.form.buttons.close.label}</Link>
                        <Button color="primary" className="start-transfer" onClick={this.showStep1}>{data.form.buttons.start_new_transfer.label}</Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              }
              {/* END PING INTEGRATION */}

            </div>
          </div>
        </Container>
        <FooterMain />
      </div>
    )
  }
}
export default AccountsTransfer