// Packages
import React from 'react';
import {
  Button, Row, Col,
  Collapse,
  Container,
  Navbar,
  NavbarToggler,
  Nav,
  NavItem,
  NavLink,
  Modal,
  ModalHeader,
  ModalBody
} from 'reactstrap';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

// Components
import AccountsSubnav from '../components/AccountsSubnav';
import PingData from '../components/Integration/PingData'; /* PING INTEGRATION: */
import Session from '../components/Utils/Session'; /* PING INTEGRATION: */
import PingOAuth from '../components/Integration/PingOAuth'; /* PING INTEGRATION: */
import JSONSearch from '../components/Utils/JSONSearch'; /* PING INTEGRATION: */
import ModalError from '../components/ModalError/'; /* PING INTEGRATION: */

// Data
import data from '../data/any-marketing.json';

// Styles
import '../styles/pages/any-marketing.scss';

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
const SearchAutocomplete = () => {
  const [inputValue, setInputValue] = React.useState("");
  const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(0);
  const [displaySuggestions, setDisplaySuggestions] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  /* BEGIN PING INTEGRATION: */
  const initialState = {
    fullName: "",
    homeAddress: "",
    email: "",
    mobileNumber: ""
  }
  const [{ fullName, homeAddress, email, mobileNumber }, setConsentState] = React.useState(initialState);
  /* END PING INTEGRATION: */

  const onChange = event => {
    const value = event.target.value;
    setInputValue(value);
    const filteredSuggestions = data.dashboard.suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filteredSuggestions);
    setDisplaySuggestions(true);
  };
  const onSelectSuggestion = index => {
    /* BEING PING INTEGRATION */
    const pingOAuthObj = new PingOAuth(); /* PING INTEGRATION: */
    const pingDataObj = new PingData(); /* PING INTEGRATION: */
    setConsentState(initialState); //Clearing previous values so they don't show while modal re-renders.
    pingOAuthObj.getToken({ uid: 'marketingApp', client: 'marketingApp', responseType: '', scopes: 'urn:pingdirectory:consent' })
      .then(consent_token => {
        pingDataObj.getUserConsentedData(consent_token, "marketing", filteredSuggestions[index])
          .then(jsonResults => {
            let fullName;
            try { fullName = jsonResults.Resources[0].cn[0]; }
            catch (e) { fullName = "This customer did not consent to receiving marketing communications."; }//Fail with the utmost grace and leisure.
            let fullAddress;
            try { fullAddress = jsonResults.Resources[0].street[0] + ", " + jsonResults.Resources[0].l[0] + ", " + jsonResults.Resources[0].postalCode[0]; }
            catch (e) { }//Fail with the utmost grace and leisure.
            let email;
            try { email = jsonResults.Resources[0].mail[0]; }
            catch (e) { }//Fail with the utmost grace and leisure.
            let mobileNumber;
            try { mobileNumber = jsonResults.Resources[0].mobile[0]; }
            catch (e) { }//Fail with the utmost grace and leisure.
            const newState = { fullName: fullName, homeAddress: fullAddress, email: email, mobileNumber: mobileNumber };
            setConsentState(newState);
          })
          .catch(error => {
            console.error("getUserConsentedData Exception", error);
          });
      })
      .catch(error => {
        console.error("getToken Exception", error);
      });
    /* END PING INTEGRATION: */

    setSelectedSuggestion(index);
    setInputValue(filteredSuggestions[index]);
    setFilteredSuggestions([]);
    setDisplaySuggestions(false);
    setIsModalOpen(true);
  };
  const triggerModal = index => {
    setIsModalOpen(false);
    setInputValue('');
  };
  return (
    <div>
      <form className="form-search form-inline float-right">
        <input className="form-control user-input" type="text" placeholder={data.dashboard.search_placeholder} onChange={onChange} value={inputValue} />
        <SuggestionsList
          inputValue={inputValue}
          selectedSuggestion={selectedSuggestion}
          onSelectSuggestion={onSelectSuggestion}
          displaySuggestions={displaySuggestions}
          suggestions={filteredSuggestions}
        />
        <img src={window._env_.PUBLIC_URL + "/images/icons/search.svg"} className="img-search" alt=''/>
      </form>
      <Modal isOpen={isModalOpen} toggle={triggerModal} className="modal-lg any-marketing modal-record" centered={true} backdropClassName="modal-backdrop-record">
        <ModalHeader toggle={triggerModal}>Record Overview</ModalHeader>
        <ModalBody>
          <Row className="mb-3" key={0}>
            <Col md="3">Name:</Col>
            <Col md="6">
              {fullName ? fullName : <div className="bg-dark">test</div>}
            </Col>
          </Row>
          <Row className="mb-3" key={1}>
            <Col md="3">Mail Address:</Col>
            <Col md="6">
              {homeAddress !== 'undefined' ? homeAddress : <div className="bg-dark">test</div>}
            </Col>
          </Row>
          <Row className="mb-3" key={2}>
            <Col md="3">Email Address:</Col>
            <Col md="6">
              {email !== 'undefined' ? email : <div className="bg-dark">test</div>}
            </Col>
          </Row>
          <Row className="mb-3" key={3}>
            <Col md="3">SMS/TXT Phone:</Col>
            <Col md="6">
              {mobileNumber !== 'undefined' ? mobileNumber : <div className="bg-dark">test</div>}
            </Col>
          </Row>
          <div className="float-right">
            <Button color="primary" className="mr-3">{data.record.buttons.inspect}</Button>
            <Button color="primary">{data.record.buttons.modify}</Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

// Main AnyMarketing Page
class AnyMarketing extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
      loggedOut: true
    };
    this.PingData = new PingData(); /* PING INTEGRATION: */
    this.Session = new Session(); /* PING INTEGRATION: */
    this.PingOAuth = new PingOAuth(); /* PING INTEGRATION: */
    this.JSONSearch = new JSONSearch(); /* PING INTEGRATION: */
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  /* BEGIN PING INTEGRATION: */
  signOut() {
    // end the local app session.
    this.Session.clearUserAppSession();
    //A marketing rep should just be taken back to P14E dock. A workforce persona shouldn't get SLO'd.
    window.location.assign("https://desktop.pingone.com/anywealthadvisor/");
  }

  componentDidMount() {
    const isLoggedOut = (this.Session.getAuthenticatedUserItem("subject") === null || this.Session.getAuthenticatedUserItem("subject") === 'undefined') ? true : false;
    this.Session.protectPage(isLoggedOut, window.location.pathname, this.Session.getAuthenticatedUserItem("bxFinanceUserType"));
    this.setState({ loggedOut: isLoggedOut});
    // Getting users from PD.
    this.PingData.getSearchableUsers({limit: "1000"})
      .then(response => response.json())
      .then(jsonSearchResults => {
        // Get an array of just uid's from the results.
        const people = this.JSONSearch.findValues(jsonSearchResults._embedded.entries, "uid");
        // Repopulate the data used in SearchAutocomplete().
        data.dashboard.suggestions = people.map(person => `${person}`);
      })
      .catch(e => {
        console.error("getSearchableUsers Exception", e)
      });
  }
  /* END PING INTEGRATION: */

  render() {
    return (
      <div className="any-marketing">
        <section className="navbar-awa">
          {/* DESKTOP NAV */}
          <Navbar color="light" light expand="md" className="navbar-desktop">
            <Container>
              <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/any-marketing-logo.svg"} alt={data.brand} /></Link>
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
                  <NavItem className="logout">
                    {!this.state.loggedOut && 
                      <a onClick={this.signOut.bind(this)} className="nav-link" ><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.logout} className="mr-1" /> {data.menus.utility.logout}</a>}
                    {this.state.loggedOut && 
                      <a onClick={this.signOut.bind(this)} className="nav-link" ><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.login} className="mr-1" /> {data.menus.utility.logout}</a>}
                  </NavItem>
                </Nav>
              </Collapse>
            </Container>
          </Navbar>
          <Navbar color="light" light expand="md" className="navbar-desktop">
            <Container>
              <Nav className="mr-auto navbar-nav-main" navbar>
                {data.menus.primary.map((item, i) => {
                  return (
                    <NavItem key={i}>
                      <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>
                    </NavItem>
                  );
                })}
              </Nav>
            </Container>
          </Navbar>
          {/* MOBILE NAV */}
          <Navbar color="light" light expand="md" className="navbar-mobile">
            <div className="mobilenav-menu">
              <NavbarToggler onClick={this.toggle.bind(this)} />
            </div>
            <div className="mobilenav-brand">
              <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/any-marketing-logo.svg"} alt={data.brand} /></Link>
            </div>
            <div className="mobilenav-login">
              <Link to="/" className="nav-link logout">Sign Out</Link>
            </div>
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className="navbar-nav-main navbar-light bg-light" navbar>
                {data.menus.primary.map((item, i) => {
                  return (
                    <NavItem key={i}>
                      <NavLink to={item.url} activeClassName="active" exact tag={RRNavLink}>{item.title}</NavLink>
                    </NavItem>
                  );
                })}
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
                <NavItem>
                  <NavLink><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.logout} className="mr-1" /> {data.menus.utility.logout}</NavLink>
                </NavItem>
              </Nav>
            </Collapse>
          </Navbar>
        </section>
        <section className="welcome-bar">
          <Container>
            <Row>
              <Col lg="12">
                <p><strong>{data.welcome_bar}</strong></p>
              </Col>
            </Row>
          </Container>
        </section>
        <section className="section-content">
          <Container>
            <Row>
              <Col lg="3">
                {
                  Object.keys(data.subnav).map(key => {
                    return (
                      <AccountsSubnav key={data.subnav[key].title} subnav={data.subnav[key]} />
                    );
                  })
                }
                <h5 className="mt-5">{data.alerts.title}</h5>
                {
                  Object.keys(data.alerts.messages).map(key => {
                    return (
                      <p key={key} dangerouslySetInnerHTML={{ __html: data.alerts.messages[key] }}></p>
                    );
                  })
                }
                <Button color="link" className="mb-4">{data.alerts.button}</Button>
              </Col>
              <Col lg="9">
                <div>
                  <Row>
                    <Col>
                      <h4 className="mb-4">{data.dashboard.title}</h4>
                    </Col>
                    <Col>
                      <SearchAutocomplete />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <img src={window._env_.PUBLIC_URL + "/images/any-marketing-table.png"} className="img-fluid mb-5" alt='' />
                    </Col>
                  </Row>
                </div>
                <div className="bg-light p-4">
                  <div className="float-right">
                    <Button color="link">{data.metrics.buttons.insights}</Button>
                    <Button color="link">{data.metrics.buttons.data}</Button>
                  </div>
                  <h4 className="mb-4">{data.metrics.title}</h4>
                  <Row>
                    <Col md="4">
                      <img src={window._env_.PUBLIC_URL + "/images/any-marketing-pie-chart.png"} className="img-fluid" alt=''/>
                    </Col>
                    <Col md="8">
                      <img src={window._env_.PUBLIC_URL + "/images/any-marketing-graph-chart.png"} className="img-fluid" alt=''/>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
        <footer className="footer-awa">
          <Container>
            <Row>
              <Col md="6" lg="4" xl="6" className="order-2 order-md-1">
                <Nav className="nav-social">
                  <NavItem>
                    <NavLink href="#"><FontAwesomeIcon icon={faLinkedinIn} size="2x" /></NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#"><FontAwesomeIcon icon={faFacebookF} size="2x" /></NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#"><FontAwesomeIcon icon={faTwitter} size="2x" /></NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#"><FontAwesomeIcon icon={faInstagram} size="2x" /></NavLink>
                  </NavItem>
                </Nav>
                <p dangerouslySetInnerHTML={{ __html: data.copyright }}></p>
              </Col>
              <Col md="6" lg="8" xl="6" className="order-1 order-md-2">
                <Nav className="nav-main">
                  {data.menus.footer.map((item, i) => {
                    return (
                      <NavItem className="nav-item-parent" key={i}>
                        <NavLink href={item.url}>{item.title}</NavLink>
                        <Nav vertical>
                          {item.children.map((item, i) => {
                            return (
                              <NavItem key={i}>
                                <NavLink target = "_blank" href={item.url}>{item.title}</NavLink>
                              </NavItem>
                            );
                          })}
                        </Nav>
                      </NavItem>
                    );
                  })}
                </Nav>
              </Col>
            </Row>
          </Container>
        </footer>
        <ModalError ref="modalError" /> {/* PING INTEGRATION */}
      </div>
    );
  }
}

export default AnyMarketing;