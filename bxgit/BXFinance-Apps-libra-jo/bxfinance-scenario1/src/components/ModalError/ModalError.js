/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

// Packages
import React from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";

// Styles
import "./ModalError.scss";

// Data
import data from "./data.json";

class ModalError extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
      errorTitle: "Unexpected Error.",
      errorMsg: "Please contact Ping Identity Technical Enablement.",
    };
    this.toggle = this.toggle.bind(this);
    this.startSSOURI = "/idp/startSSO.ping?PartnerSpId=" + window._env_.REACT_APP_HOST; //TODO this needs to be moved to ping-endpoints.json
  }
  toggle(title, msg, callBack) {
    this.setState({
      isOpen: !this.state.isOpen,
      errorTitle: title,
      errorMsg: msg,
      callBack: callBack,
    });
  }
  continueBtn() {
    window.location.assign(this.startSSOURI);
  }
  render() {
    const closeBtn = <div />;
    return (
      <div>
        <Modal
          isOpen={this.state.isOpen}
          toggle={this.toggle.bind(this)}
          className="modal-error"
        >
          <ModalHeader toggle={this.toggle.bind(this)} close={closeBtn}>
            <img src={window._env_.PUBLIC_URL + "/images/logo.svg"} alt="logo" />
          </ModalHeader>
          <ModalBody>
            <h4>{this.state.errorTitle}</h4>
            <div>{this.state.errorMsg}</div>
            <Button color="primary" onClick={this.continueBtn.bind(this)}>
              {data.button}
            </Button><br />
            <Button type="button" color="link" size="sm" className="text-info pl-0" onClick={() => { this.toggle(); }}>Quit</Button> {/* PING INTEGRATION:*/}
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalError;
