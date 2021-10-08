// Packages
import React, { useState } from 'react';
import { FormGroup, Label, Input} from 'reactstrap';

// Styles
import "./FormPassword.scss";

class FormPassword extends React.Component {
  componentDidMount () {
    let eye = document.querySelectorAll(".icon-eye");
    let inputEye = document.querySelectorAll(".form-password > input");

    for(let i=0; i < eye.length; i++){
      eye[i].addEventListener('mousedown', function(){
        inputEye[i - 1].type = "text";
      });  
      eye[i].addEventListener('mouseup', function(){
        inputEye[i - 1].type = "password";
      });
    }
  }
  render() {
    return (
      <FormGroup className="form-group-light form-password">
        <Label for="password">{this.props.label}</Label>
        <img src={window._env_.PUBLIC_URL + "/images/icons/password-hide.svg"} alt="password" className="icon-eye" />
        <Input type="password" onChange={this.props.setPassword.bind(this)} name={this.props.name} id={this.props.name} placeholder={this.props.placeholder} />
      </FormGroup>
    );
  }
};

export default FormPassword;
