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
  Media
} from 'reactstrap';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

// Components
import WelcomeBar from '../components/WelcomeBar/';
import Session from '../components/Utils/Session';  /* PING INTEGRATION: */

// Data
import data from '../data/any-wealth-advisor.json';

// Styles
import '../styles/pages/any-wealth-advisor.scss';

class AnyWealthAdvisor extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false
    };
    this.Session = new Session();
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  /* BEGIN PING INTEGRATION: */
  backToDashboard() {
    window.location.assign("/app/banking");
  }
  componentDidMount() {
    // BEGIN PING INTEGRATION
    const isLoggedOut = (this.Session.getAuthenticatedUserItem("subject") === null || this.Session.getAuthenticatedUserItem("subject") === 'undefined') ? true : false;
    this.Session.protectPage(isLoggedOut, window.location.pathname, this.Session.getAuthenticatedUserItem("bxFinanceUserType"));
  }
  /* END PING INTEGRATION: */
  render() {
    return (
      <div className="any-wealth-advisor">
        <section className="navbar-awa">
          {/* DESKTOP NAV */}
          <Navbar color="light" light expand="md" className="navbar-desktop">
            <Container>
              <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/any-wealth-advisor-logo.svg"} alt={data.brand} /></Link>
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
                    <NavLink onClick={this.backToDashboard.bind(this)}><img src={window._env_.PUBLIC_URL + "/images/icons/user.svg"} alt={data.menus.utility.back} className="mr-1" /> {data.menus.utility.back}</NavLink>
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
              <Link to="/" className="navbar-brand"><img src={window._env_.PUBLIC_URL + "/images/any-wealth-advisor-logo.svg"} alt={data.brand} /></Link>
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
        <WelcomeBar firstName={this.Session.getAuthenticatedUserItem("firstName")}/>
        <section className="section-content">
          <Container>
            <Row>
              <Col lg="3">
                {/* <h5>{data.profile.accounts.title}</h5>
                <p dangerouslySetInnerHTML={{__html: data.profile.accounts.content}}></p>
                <Button color="link">{data.profile.accounts.button}</Button> */}
                <h5 className="mt-5">{data.profile.advisor.title}</h5>
                <Media>
                  <Media left href="#">
                    <Media object src={window._env_.PUBLIC_URL + "/images/anywealthadvisor-photo.png"} alt="Generic placeholder image" />
                  </Media>
                  <Media body>
                    <p dangerouslySetInnerHTML={{__html: data.profile.advisor.content}}></p>
                    <Button color="link" className="mb-3">{data.profile.advisor.button}</Button>
                  </Media>
                </Media>
              </Col>
              <Col lg="9">
                <div className="bg-light p-4">
                  <Row>
                    <Col md="6">
                      <h5>{data.profile.porfolio_growth.title}</h5>
                      <p dangerouslySetInnerHTML={{__html: data.profile.porfolio_growth.content}}></p>
                      <img src={window._env_.PUBLIC_URL + "/images/anywealthadvisor-graph-chart.png"} className="img-fluid my-3" alt='Porfolio Growth'/>
                    </Col>
                    <Col md="6">
                      <h5>{data.profile.porfolio_allocations.title}</h5>
                      <p dangerouslySetInnerHTML={{__html: data.profile.porfolio_allocations.content}}></p>
                      <img src={window._env_.PUBLIC_URL + "/images/anywealthadvisor-pie-chart.png"} className="img-pie-chart" alt='Portfolio Allocations'/>
                      <p className="text-right">
                        <Button color="link">{data.profile.porfolio_allocations.button}</Button>
                      </p>
                    </Col>
                  </Row>
                </div>
                <div className="p-4">
                  <Row>
                    <Col md="6">
                      <p dangerouslySetInnerHTML={{__html: data.profile.contact.content}}></p>
                    </Col>
                    <Col md="6" className="text-right">
                      <Button color="primary">{data.profile.contact.button}</Button>
                    </Col>
                  </Row>
                </div>
                <div className="bg-light p-4">
                  <h2 className="mb-4">{data.profile.offers.title}</h2>
                  <Row>
                    <Col md="6">
                      <h5>{data.profile.offers.introduction.title}</h5>
                      <p dangerouslySetInnerHTML={{__html: data.profile.offers.introduction.content}}></p>
                      <Button color="link">{data.profile.offers.introduction.button}</Button>
                    </Col>
                    <Col md="6">
                      <h5>{data.profile.offers.seminar.title}</h5>
                      <p dangerouslySetInnerHTML={{__html: data.profile.offers.seminar.content}}></p>
                      <Button color="link">{data.profile.offers.seminar.button}</Button>
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
                <p dangerouslySetInnerHTML={{__html: data.copyright}}></p>
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
                                <NavLink target="_blank" href={item.url}>{item.title}</NavLink>
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
      </div>
    );
  }
}

export default AnyWealthAdvisor;
