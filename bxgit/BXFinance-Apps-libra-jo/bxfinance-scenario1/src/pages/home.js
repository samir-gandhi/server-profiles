// Packages
import React from 'react';
import { Button, Jumbotron, Container, Row, Col } from 'reactstrap';

// Components
import NavbarMain from '../components/NavbarMain';
import CardRewards from '../components/CardRewards/';
import FooterMain from '../components/FooterMain';

// Data
import data from '../data/home.json';

// Styles
import '../styles/pages/home.scss';

function Home() {
  return (
    <div className="home">
      <NavbarMain></NavbarMain>
      <Jumbotron fluid className="jumbotron-hero-home" style={{backgroundImage: `url(${window._env_.PUBLIC_URL}/images/home-hero-background.jpg)`}}>
        <Container>
          <Row>
            <Col md="6" lg="8">
              <h1 className="display-3" dangerouslySetInnerHTML={{__html: data.hero.title}}></h1>
              <p className="lead">{data.hero.subtitle}</p>
              <Button color="primary">{data.hero.button}</Button>
            </Col>
            <Col md="6" lg="4">
              <CardRewards />
            </Col>
          </Row>
        </Container>
      </Jumbotron>
      <section className="section-home-cta-bar">
        <Container>
          <h3 dangerouslySetInnerHTML={{__html: data.cta_bar}}></h3>
        </Container>
      </section>
      <section className="section-home-features">
        <Container>
          <Row>
            {data.features.map((item, i) => {
              return (
                <Col md="4" key={i}>
                  <h4>{item.title}</h4>
                  <p>{item.content}</p>
                  <Button color="link" className="text-info">{item.button}</Button>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>
      <FooterMain></FooterMain>
    </div>
  );
}

export default Home;
