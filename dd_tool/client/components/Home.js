import React, { Component } from 'react';
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;

import Checkbox from 'material-ui/Checkbox';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import { Row, Col} from 'react-bootstrap';

import FlatButton from 'material-ui/FlatButton';
import Forward from 'material-ui/svg-icons/content/forward';
import AddBox from 'material-ui/svg-icons/content/add-box';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import {fullWhite} from 'material-ui/styles/colors';
import $ from 'jquery';

import AppBar from 'material-ui/AppBar';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

const styles = {
  listDomains:{
    borderStyle: 'solid',
    borderColor: '#C09ED7',
    background: 'white',
    borderRadius: '0px 0px 0px 0px',
    borderWidth: '0px 0px 1px 0px',
  },
};


class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      domains: undefined,
      openCreateDomain: false,
      openDeleteDomain: false,
      openDuplicateDomainName:false,
      newNameDomain:"",
      delDomains: {}
    };
    this.focusTextField = this.focusTextField.bind(this);
    this.textInput = null;
  }

  render(){
      <div>Home</div>
  }

}

Home.defaultProps = {
    backgroundColor:"#9A7BB0",
};

export default Home;
