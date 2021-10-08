// Packages
import React from 'react';
import { withRouter } from "react-router"; /* PING INTEGRATION: */
import {
  Button, Row, Col, Card, CardBody,
  Container,
  Media
} from 'reactstrap';

// Components
import NavbarMain from '../../components/NavbarMain';
import FooterMain from '../../components/FooterMain';
import Session from '../../components/Utils/Session'; /* PING INTEGRATION: */
import PingData from '../../components/Integration/PingData'; /* PING INTEGRATION: */
import JSONSearch from '../../components/Utils/JSONSearch'; /* PING INTEGRATION: */
import PingOAuth from '../../components/Integration/PingOAuth'; /* PING INTEGRATION: */

// Data
import data from '../../data/advisor.json';

// Styles
import '../../styles/pages/advisor.scss';

/* BEGIN PING INTEGRATION: */
const updateSelectedUserAndConsent = (selectedUser, stateCallback) => {
  const sessionObj = new Session();
  const pingOAuthObj = new PingOAuth();
  const pingDataObj = new PingData();
  let newState = {
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
    mobile: "",
    acct_0: 0,
    acct_1: 0,
    acct_2: 0
  };

  let consentData = {};
  pingOAuthObj.getToken({ uid: selectedUser, client: 'anywealthadvisorApp', responseType: '', scopes: 'urn:pingdirectory:consent' })
    .then(consentToken => {
      pingDataObj.getUserConsentedData(consentToken, "advisor")
        .then(consentData => {
          if (consentData.Data !== undefined) {//In case we have no consent record.
            newState.acct_0 = typeof consentData.Data.Balance[0] !== 'undefined' ? consentData.Data.Balance[0].Amount.Amount : 0;
            newState.acct_1 = typeof consentData.Data.Balance[1] !== 'undefined' ? consentData.Data.Balance[1].Amount.Amount : 0;
            newState.acct_2 = typeof consentData.Data.Balance[2] !== 'undefined' ? consentData.Data.Balance[2].Amount.Amount : 0;
            stateCallback(newState);
          }
        });

    });

  //Get the selected users entry in PD.
  pingDataObj.getUserEntry(selectedUser)
    .then(response => response.json())
    .then(jsonResponse => {
      newState.fullName = jsonResponse.cn[0];
      newState.street = jsonResponse.street[0];
      newState.city = jsonResponse.l[0];
      newState.postalCode = jsonResponse.postalCode[0];
      newState.mobile = jsonResponse.mobile[0];
      stateCallback(newState);
    })
    .catch(error => {
      console.error("getUserEntry Exception", error);
    });
}
/* END PING INTEGRATION: */

// Autocomplete Suggestion List
const SuggestionsList = props => {
  const {
    suggestions,
    inputValue,
    onSelectSuggestion,
    displaySuggestions,
    selectedSuggestion
  } = props;

  if (inputValue && displaySuggestions) {
    if (suggestions.length > 0) {
      return (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => {
            const isSelected = selectedSuggestion === index;
            const classname = `suggestion ${isSelected ? "selected" : ""}`;
            return (
              <li
                key={index}
                className={classname}
                onClick={() => onSelectSuggestion(index)}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      );
    } else {
      return <ul className="suggestions-list"><li className="suggestion">No suggestions available...</li></ul>;
    }
  }
  return <div></div>;
};

// Search Autocomplete
const SearchAutocomplete = (props) => {
  const [inputValue, setInputValue] = React.useState("");
  const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(0);
  const [displaySuggestions, setDisplaySuggestions] = React.useState(false);

  const onChange = event => {
    const value = event.target.value;
    setInputValue(value);
    const filteredSuggestions = data.clients.suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filteredSuggestions);
    setDisplaySuggestions(true);
  };

  const onSelectSuggestion = index => {
    updateSelectedUserAndConsent(filteredSuggestions[index], props.stateCallback); /* PING INTEGRATION: */

    setSelectedSuggestion(index);
    //setInputValue(filteredSuggestions[index]); /* PING INTEGRATION: commented this out because we don't want the selected username to persist in the search box.*/
    setFilteredSuggestions([]);
    setDisplaySuggestions(false);
  };
  return (
    <div>
      <form className="form-search form-inline float-right">
        <input className="form-control user-input" type="text" placeholder={data.clients.search_placeholder} onChange={onChange} value={inputValue} />
        <SuggestionsList
          inputValue={inputValue}
          selectedSuggestion={selectedSuggestion}
          onSelectSuggestion={onSelectSuggestion}
          displaySuggestions={displaySuggestions}
          suggestions={filteredSuggestions}
        />
        <img src={window._env_.PUBLIC_URL + "/images/icons/search.svg"} className="img-search" alt='' />
      </form>
    </div>
  );
};

// AdvisorClient Page
class AdvisorClient extends React.Component {
  constructor() {
    super();
    this.Session = new Session(); /* PING INTEGRATION: */
    this.PingData = new PingData(); /* PING INTEGRATION: */
    this.JSONSearch = new JSONSearch(); /* PING INTEGRATION: */
    this.state = {                      /* PING INTEGRATION: */
      fullName: "",
      street: "",
      city: "",
      postalCode: "",
      mobile: "",
      acct_0: 0,
      acct_1: 0,
      acct_2: 0
    };
    this.updateUserState = this.updateUserState.bind(this); /* PING INTEGRATION: */
  }

  /* BEGIN PING INTEGRATION */
  //Callback function: functional components declared (above) outside of main component (here), need to update state in main component.
  updateUserState(userObj) {
    const newState = {
      fullName: userObj.fullName,
      street: userObj.street,
      city: userObj.city,
      postalCode: userObj.postalCode,
      mobile: userObj.mobile,
      acct_0: userObj.acct_0,
      acct_1: userObj.acct_1,
      acct_2: userObj.acct_2
    };
    this.setState(newState);
  }

  componentDidMount() {
    //Grab the user passed over from search on the /advisor page.
    const uid = this.props.location.state.client;

    updateSelectedUserAndConsent(uid, this.updateUserState);

    // Getting searchable users from PD.
    this.PingData.getSearchableUsers({limit: "1000"})
      .then(response => response.json())
      .then(jsonSearchResults => {
        // Get an array of just uid's from the results.
        const people = this.JSONSearch.findValues(jsonSearchResults._embedded.entries, "uid");
        // Repopulate the data used in SearchAutocomplete().
        data.clients.suggestions = people.map(person => `${person}`);
      })
      .catch(e => {
        console.error("getSearchableUsers Exception", e)
      });
  }
  /* END PING INTEGRATION */
  render() {
    const noConsent = this.state.acct_0 + this.state.acct_1 + this.state.acct_2;
    return (
      <div className="accounts advisor">
        <NavbarMain data={data} />
        <section className="welcome-bar">
          <Container>
            <Row>
              <Col lg="12">
                <p>{data.welcome_bar}{this.Session.getAuthenticatedUserItem("firstName")}</p>
              </Col>
            </Row>
          </Container>
        </section>
        <section className="section-content">
          <Container>
            <Row>
              <Col lg="4">
                <h5>{data.profile.advisor.title}</h5>
                <Card className="card-side">
                  <CardBody>
                    <Media>
                      <Media left href="#">
                        <Media object src={window._env_.PUBLIC_URL + "/images/anywealthadvisor-photo.png"} alt="Generic placeholder image" />
                      </Media>
                      <Media body>
                        <span dangerouslySetInnerHTML={{ __html: data.profile.advisor.content }}></span>
                        <Button color="link">{data.profile.advisor.button}</Button>
                      </Media>
                    </Media>
                  </CardBody>
                </Card>
                <h5 className="mt-5">{data.alerts.title}</h5>
                <Card className="card-side mb-5">
                  <CardBody>
                    {
                      Object.keys(data.alerts.messages).map(key => {
                        return (
                          <p key={key} dangerouslySetInnerHTML={{ __html: data.alerts.messages[key] }}></p>
                        );
                      })
                    }
                    <Button color="link">{data.alerts.button}</Button>
                  </CardBody>
                </Card>
              </Col>
              <Col lg="8">
                <div>
                  <Row>
                    <Col>
                      <h5 className="mb-4">{data.clients.title}</h5>
                    </Col>
                    <Col>
                      <SearchAutocomplete stateCallback={this.updateUserState} />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Card className="client-detail">
                        <CardBody>
                          <Row>
                            <Col md="4" className="col-side">
                              <Media>
                                <Media body>
                                  {/* BEGIN INTEGRATION */}
                                  <strong>{this.state.fullName}</strong><br />
                                  {this.state.street}<br />
                                  {this.state.city}, {this.state.postalCode}<br />
                                        Mobile: {this.state.mobile}<br />
                                  <a href="#">See Notes</a> | <a href="#">Modify Records</a>
                                  {/* END PING INTEGRATION */}
                                  <Button color="primary">{data.client_detail.side.button}</Button>
                                </Media>
                              </Media>
                            </Col>
                            <Col md="8" className="col-content">
                              <p><strong>{data.client_detail.content.title}</strong></p>
                              {this.state.acct_0 !== 0 &&
                                <Row key={0}>
                                  <Col md="8">BXFinance Checking (Account 1)</Col>
                                  <Col md="4">{this.state.acct_0}</Col>
                                </Row>}
                              {this.state.acct_1 !== 0 &&
                                <Row key={1}>
                                  <Col md="8">BXFinance Savings (Account 1)</Col>
                                  <Col md="4">{this.state.acct_1}</Col>
                                </Row>}
                              {this.state.acct_2 !== 0 &&
                                <Row key={2}>
                                  <Col md="8">BXFinance Savings (Account 2)</Col>
                                  <Col md="4">{this.state.acct_2}</Col>
                                </Row>}
                              {!noConsent &&
                                <Row key={3}>
                                  <Col md="8">This client did not consent<br />to share accounts with you.</Col>
                                  <Col md="4"></Col>
                                </Row>
                              }
                              <p className="mt-3" dangerouslySetInnerHTML={{ __html: data.client_detail.content.links }}></p>
                              <Row>
                                <Col md="8">
                                  <p><strong>{data.client_detail.content.portfolio_overview}</strong></p>
                                  <img src={window._env_.PUBLIC_URL + "/images/advisor-client-chart.png"} className="img-fluid" alt='Portfolio Overview'/>
                                </Col>
                                <Col md="4">
                                  <p><strong>{data.client_detail.content.portfolio_view}</strong></p>
                                  <img src={window._env_.PUBLIC_URL + "/images/advisor-client-pie-chart.png"} className="img-fluid" alt='Portfolio View'/>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </div>
                <div>
                  <h5 className="mb-3">{data.clients_recent.title}</h5>
                  <p dangerouslySetInnerHTML={{ __html: data.clients_recent.content }}></p>
                  <Button color="link">{data.clients_recent.button}</Button>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
        <FooterMain />
      </div>
    );
  }
}

export default withRouter(AdvisorClient);