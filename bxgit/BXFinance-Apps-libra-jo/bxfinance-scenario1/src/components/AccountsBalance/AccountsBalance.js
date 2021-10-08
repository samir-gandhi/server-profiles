// Packages
import React, { useState } from 'react';
import { Collapse, Button  } from 'reactstrap';

// Styles
import "./AccountsBalance.scss";

const AccountsBalance = (props) => {
  
  const [isOpen, setIsOpen] = useState(true);
  const toggle = () => setIsOpen(!isOpen);

  //Formatting dollar amounts to currency for confirmation or deny screens.
  //Defaulting to USA for now.
  //TODO turn into call to GeoLocate component to format according to user's locale.
  const currencyFormat = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  return (
    <div className="accounts-balance">
      <div className="accounts-balance-header">
        <a onClick={toggle}>{props.balance.title}</a>
      <Button color="primary">See All Activity</Button>
      </div>
      <Collapse isOpen={isOpen}>
        <table>
          <thead>
            <tr>
              <th>Accounts</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(props.balance.accounts).map(key => {
                return (
                  <tr key={key}>
                    <td><a href={props.balance.accounts[key].href}>{props.balance.accounts[key].account}</a></td>
                    {/* <td>{props.balance.accounts[key].balance} PING INTEGRATION: replaced this with below line.  */}
                    <td>${props.myAccounts.length > 0 && props.myAccounts[key].Amount.Amount}</td>
                  </tr>
                );
              })      
            }
          </tbody>
        </table>
      </Collapse>
    </div>
  );
};

export default AccountsBalance;
