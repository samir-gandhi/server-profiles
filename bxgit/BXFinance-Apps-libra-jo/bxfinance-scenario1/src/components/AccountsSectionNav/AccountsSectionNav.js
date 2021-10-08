// Packages
import React, { useState } from 'react';
import { Button } from 'reactstrap';
import { Link } from 'react-router-dom'
import classNames from "classnames";

// Styles
import "./AccountsSectionNav.scss";

const AccountsSectionNav = (props) => {
  
  return (
    <div className={classNames("accounts-section-nav", { "white": props.data.white }, { "curved": props.data.curved })}>
      <div className="accounts-section-nav-text">
        <h4>{props.data.title}</h4>
        <p>{props.data.description}</p>
      </div>
      {/* PING INTEGRATION: logic to use standard anchor tag if rendering a button for profile mgmt updates. Links to PF LIP. */}
      {props.data.title === "Personal Details" ? 
        <a href={props.data.pfProfileMgmtURI}><Button color="primary">{props.data.button_text}</Button></a> :
        <Link to={props.data.button_href}><Button color="primary">{props.data.button_text}</Button></Link>}
    </div>
  );
};

export default AccountsSectionNav;
