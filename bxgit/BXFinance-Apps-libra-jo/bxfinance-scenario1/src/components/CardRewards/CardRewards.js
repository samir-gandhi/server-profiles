// Packages
import React from 'react';
import { Button, Card, CardBody, CardTitle, CardText, CardLink } from 'reactstrap';

// Styles
import "./CardRewards.scss";

// Data
import data from './data.json';

class CardRewards extends React.Component {

  newTab(uri) {
    window.open(window._env_.PUBLIC_URL + uri, "_blank")
  }
  
  render() {
    const pathName=window.location.pathname;
    return (
      <div>
        <Card className="card-rewards">
          <CardBody>
            <CardTitle tag="h3">{data.title}</CardTitle>
            <CardText>{data.content}</CardText>
            { /* Don't show 'Apply Today' link on the home page. Must be logged in to apply. */ }
            { (!(pathName == "/app/") && !(pathName == "/app")) && 
              <CardLink onClick={() => this.newTab("/credit-card")}>{data.button}</CardLink> }
          </CardBody>
          <img src={window._env_.PUBLIC_URL + "/images/home-hero-card.png"} className="img-credit-card" alt="card" />
        </Card>
      </div>
    );
  }
}

export default CardRewards;
