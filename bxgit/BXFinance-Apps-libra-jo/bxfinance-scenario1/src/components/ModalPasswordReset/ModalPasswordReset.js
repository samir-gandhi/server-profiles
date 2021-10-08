/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

// Packages
import React from 'react';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  Input,
  CustomInput,
  TabContent, TabPane
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

// Components
import FormPassword from '../../components/FormPassword';

// Styles
import "./ModalPasswordReset.scss";

// Data
import data from './data.json';

class ModalPasswordReset extends React.Component {
  constructor() {
    super();
    this.state = {
      isOpen: false,
      activeTab: '1'
    };
  }
  onClosed() {
    this.setState({
      activeTab: '1'
    });
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  toggleTab(tab) {
    this.setState({
      activeTab: tab
    });
  }
  render() {
    const closeBtn = <div />;
    return (
      <div>
        <Modal isOpen={this.state.isOpen} toggle={this.toggle.bind(this)} onClosed={this.onClosed.bind(this)} className="modal-login">
          <ModalHeader toggle={this.toggle.bind(this)} close={closeBtn}><img src={window._env_.PUBLIC_URL + "/images/logo.svg"} alt="logo" /></ModalHeader>
          <ModalBody>
            <form>
              <TabContent activeTab={this.state.activeTab}>
                <TabPane tabId="1">
                  <h4>{data.titles.reset}</h4>
                  <FormGroup className="form-group-light">
                    <Label for="password">{data.form.fields.password.label}</Label>
                    <Input type="text" name="password" id="password" placeholder={data.form.fields.password.placeholder} />
                  </FormGroup>
                  <FormGroup className="form-group-light">
                    <Label for="password_confirm">{data.form.fields.password_confirm.label}</Label>
                    <Input type="text" name="password_confirm" id="password_confirm" placeholder={data.form.fields.password_confirm.placeholder} />
                  </FormGroup>
                  <div className="mb-3">
                    <Button type="button" color="primary" onClick={() => { this.toggleTab('2'); }}>{data.form.buttons.save}</Button>
                  </div>
                </TabPane>
                <TabPane tabId="2">
                  <h4>{data.titles.success}</h4>
                  <div className="mb-3 text-center">
                    <Button type="button" color="primary" onClick={this.toggle.bind(this)}>{data.form.buttons.close}</Button>
                  </div>
                </TabPane>
              </TabContent>
            </form>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}

export default ModalPasswordReset;
