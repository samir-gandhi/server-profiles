// Packages
import React from 'react';
import {
  Col,
  Container,
  Nav,
  NavItem,
  NavLink,
  Row
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

// Styles
import "./FooterMain.scss";

// Data
import data from './data.json';

const FooterMain = (props) => {
  return (
    <footer className="footer-main">
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
            <p><a className="text-muted">Iconify</a></p>
          </Col>
          <Col md="6" lg="8" xl="6" className="order-1 order-md-2">
            <Nav className="nav-main">
              {data.menu.map((item, i) => {
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
  );
}

export default FooterMain;
