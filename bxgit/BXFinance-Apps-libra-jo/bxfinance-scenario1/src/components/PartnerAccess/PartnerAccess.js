/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

// Packages
import React from 'react';
import {
  FormGroup,
  Label,
  Input,
  CustomInput,
  Row,
  Col
} from 'reactstrap';
import classNames from "classnames";

// Styles
import './PartnerAccess.scss';

class PartnerAccess extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
      isModalOpen: false
    };
    this.toggle = this.toggle.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  toggleModal() {
    this.setState({
      isModalOpen: !this.state.isModalOpen
    });
  }
  render() {
    return (
      <>
        <Row className={classNames({ "gray": (this.props.index % 2) })}>
          <Col md={12} lg={4}><img src={window._env_.PUBLIC_URL + this.props.data.logo} alt="" /></Col>
          <Col md={12} lg={4}>
            <CustomInput type="radio" id={`${this.props.data.name}_yes`} checked={this.state.isOpen} name={this.props.data.name} label="Yes" onClick={this.toggle} />
            <CustomInput type="radio" id={`${this.props.data.name}_no`} checked={!this.state.isOpen} name={this.props.data.name} label="No" onClick={this.toggle} />
          </Col>
          <Col md={12} lg={4}><a href="#" className="partner-overlay" onClick={this.toggleModal}>{this.props.data.learn_more}</a></Col>
        </Row>
        <Row className={classNames("accounts-access", { "visible": this.state.isOpen }, { "gray": (this.props.index % 2) })}>
          <Col>
            <p>{this.props.data.permissions_hdr}</p>
            {
              Object.keys(this.props.data.permissions).map(index2 => {
                return (
                <FormGroup check>
                  <Label className="custom-checkbox" check>
                    <Input type="checkbox" checked={this.props.data.permissions[index2].checked} /> {this.props.data.permissions[index2].label}
                    <span class="checkmark"><span></span></span>
                  </Label>
                </FormGroup>
                )
              })
            }                     
          </Col>
        </Row>
        { this.state.isModalOpen &&
          <div className="psmodal psmodal-anywealthadvisor">
            <a href="#" className="close" onClick={this.toggleModal}><span className="sr-only">Close</span></a>
            <div dangerouslySetInnerHTML={{__html: this.props.data.modal}} />
          </div>
        }
      </>
    );
  }
}

export default PartnerAccess;
