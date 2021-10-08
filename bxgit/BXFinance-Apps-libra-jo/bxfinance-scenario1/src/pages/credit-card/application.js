import React from 'react'
import {
  Button,
  Container,
  Card,
  CardBody, 
  CardTitle,
} from 'reactstrap';

// Components
import NavbarMain from '../../components/NavbarMain';
import WelcomeBar from '../../components/WelcomeBar';
import FooterMain from '../../components/FooterMain';
import Session from '../../components/Utils/Session'; /* PING INTEGRATION: */

// Data
import data from '../../components/CardRewards/data.json';

// Styles
import "../../styles/pages/credit-card/application.scss";

class Application extends React.Component {

  constructor(props) {
    super(props);
    this.Session = new Session(); /* PING INTEGRATION: */
  }

  render() {
    return (
      <div className="apply-accounts">
        <NavbarMain />
        <WelcomeBar welcomeMessage="Thank you" firstName={this.Session.getAuthenticatedUserItem("firstName")} />
        <Container>
        <div className="inner">
            <div className="sidebar">
              <div>
                <Card className="apply-rewards">
                  <CardBody>
                    <CardTitle tag="h3">{data.appTitle}</CardTitle>
                    <Button color="link" className="text-info">{data.appButton}</Button>
                  </CardBody>
                  <img src={window._env_.PUBLIC_URL + "/images/home-hero-card.png"} className="img-credit-card" alt="card" />
                </Card>
              </div>
            </div>
            <div className="content">
              <div className="accounts-hdr">
                <h1>{data.appHeader}</h1>
              </div>
              <div>
                <Card className="apply-description">
                  <CardBody>
                    <p>We need to review your application a little longer.</p>
                    <p>We'll let you know our decision in writing as soon as we can. If we approve your application, you'll receive your card in the mail in 7-10 business days. Please don't resubmit your application.</p>
                    <p>Thank you for choosing SHINE.</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </Container>
        <FooterMain />
      </div>
    )
  }
}
export default Application

