import React from 'react'
import { Container } from 'reactstrap';

// Components
import NavbarMain from '../components/NavbarMain';
import WelcomeBar from '../components/WelcomeBar';
import FooterMain from '../components/FooterMain';
import AccountsSubnav from '../components/AccountsSubnav';
import AccountsDropdown from '../components/AccountsDropdown';
import AccountsBalance from '../components/AccountsBalance';
import CardRewards from '../components/CardRewards';
import Session from '../components/Utils/Session'; /* PING INTEGRATION */
import PingData from '../components/Integration/PingData'; /* PING INTEGRATION */
import JSONSearch from '../components/Utils/JSONSearch'; /* PING INTEGRATION */
import PingOAuth from '../components/Integration/PingOAuth'; /* PING INTEGRATION: */
import OpenBanking from '../components/Integration/OpenBanking'; /* PING INTEGRATION: */

// Data
import data from '../data/accounts-dashboard.json';

// Styles
import "../styles/pages/accounts.scss";

class AccountsDashboard extends React.Component {
  constructor() {
    super();
    /* BEGIN PING INTEGRATION: */
    this.Session = new Session();
    this.PingData = new PingData();
    this.JSONSearch = new JSONSearch();
    this.PingOAuth = new PingOAuth();
    this.OpenBanking = new OpenBanking();
    this.state = {
      myAccounts: []
    }
    /* END PING INTEGRATION: */
  }

  /* BEGIN PING INTEGRATION: */
  componentDidMount() {
    let acctIDsArr = [];
    let acctIDsArrSimple = [];

    this.PingData.getUserEntry(this.Session.getAuthenticatedUserItem("uid"))
      .then(response => response.json())
      .then(jsonData => {
        acctIDsArr = this.JSONSearch.findValues(jsonData, "bxFinanceUserAccountIDs");
        acctIDsArrSimple = this.JSONSearch.findValues(acctIDsArr, "ids");
        this.Session.setAuthenticatedUserItem("accts", acctIDsArrSimple[0]); //TODO we can re-use this to save the getUserEntry() call. Only call PD if accts not in session.
        if (acctIDsArr.length) {
          // Existing user with accounts already provisioned, so just get balances.
          console.info("Existing user:", "Getting account balances.");
          this.PingOAuth.getToken({ uid: this.Session.getAuthenticatedUserItem("uid"), scopes: 'urn:pingdirectory:consent' })
            .then(token => {
              this.Session.setAuthenticatedUserItem("AT", token); //TODO need to re-use this token everywhere to avoid multiple getToken calls. Need handling for expired tokens though.
              this.OpenBanking.getAccountBalances(token)
                .then(response => response.json())
                .then(jsonData => {
                  this.setState({ myAccounts: jsonData.Data.Balance });
                })
                .catch(e => {
                  console.error("GetAccountBalances Exception", e)
                });
            })
            .catch(e => {
              console.error("GetToken Exception", e);
            });
        } else {
          // Brand new registered user, so we need to provision accounts and update PD, then fetch balances.
          let acctIdsArr = [];
          console.info("New User:", "Provisioning bank accounts and getting balances.");
          this.PingOAuth.getToken({ uid: this.Session.getAuthenticatedUserItem("uid"), scopes: 'urn:pingdirectory:consent' })
            .then(token => {
              this.Session.setAuthenticatedUserItem("AT", token);
              this.OpenBanking.provisionAccounts(token)
                .then(result => {
                  acctIdsArr = this.JSONSearch.findValues(result, "AccountId");
                  this.PingData.updateUserEntry(acctIdsArr, this.Session.getAuthenticatedUserItem("uid"))
                    .then(response => {
                      this.OpenBanking.getAccountBalances(this.Session.getAuthenticatedUserItem("AT"))
                        .then(response => response.json())
                        .then(jsonData => {
                          this.setState({ myAccounts: jsonData.Data.Balance });
                          acctIDsArr = this.JSONSearch.findValues(jsonData.Data.Balance, "AccountId");
                          this.Session.setAuthenticatedUserItem("accts", acctIDsArr); //TODO can we reuse this? Are we anywhere already?
                        })
                        .catch(e => {
                          console.error("Get Account Balances Exception", e)
                        });
                    })
                    .catch(e => {
                      console.error("Update User Entry Exception", e)
                    });
                })
                .catch(e => {
                  console.error("Provision Accounts Exception", e)
                });
            })
            .catch(e => {
              console.error("Get Token Exception", e);
            });
        }
      }).catch(e => {
        console.error("Get User Entry Exception", e);
      });
  }
  /* END PING INTEGRATION: */

  render() {

    return (
      <div className="accounts accounts-dashboard">
        <NavbarMain />
        <WelcomeBar firstName={this.Session.getAuthenticatedUserItem('firstName')} /> {/* PING INTEGRATION: added passing of firstName prop. */}
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
              {
                Object.keys(data.balances).map(key => {
                  return (
                    <AccountsBalance key={data.balances[key].title} balance={data.balances[key]} myAccounts={this.state.myAccounts} />
                  );
                })
              }
            </div>
          </div>
        </Container>
        <FooterMain />
      </div>
    )
  }
}
export default AccountsDashboard