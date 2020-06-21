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

  addDelDomains(id,name){
    var tempDelDomains = this.state.delDomains;
    tempDelDomains[id]=name;
    this.setState({delDomains:tempDelDomains});
  }

  deleteDomains(){
    var delDomains= this.state.delDomains;
    $.post(
      '/delDomain',
      {'domains': JSON.stringify(delDomains)},
      function(domains) {
        this.setState({openDeleteDomain: false, delDomains: {}});
        this.getAvailableDomains();
        this.forceUpdate();
      }.bind(this)
    );
  };

  getAvailableDomains(){
    $.post(
      '/getAvailableDomains',
      {"type": "init"},
      function(domains) {
        this.setState({domains: domains['crawlers']});
      }.bind(this)
    );
  }
  componentWillMount() {
    this.getAvailableDomains();
  }

  
   focusTextField() {
     setTimeout(() => this.textInput.focus(), 100);
   }


  createNewDomain(){
    var nameDomain= this.state.newNameDomain;
    var duplicateDomain = false;
    var mydata = this.state.domains;
    Object.keys(mydata).map((k, index)=>{ var name = mydata[k].name; if(name.trim().toLowerCase().replace(/\s+/g,"_") === nameDomain.trim().toLowerCase().replace(/\s+/g,"_")){ duplicateDomain = true;} });   // .trim() to remove last and first spaces from a string. 
    if(!duplicateDomain){
      $.post(
        '/addDomain',
        {'index_name': nameDomain},
        function(domains) {
          this.setState({openCreateDomain: false, newNameDomain:"", openDuplicateDomainName:false });
          this.getAvailableDomains();
          this.forceUpdate();
        }.bind(this)
      );
    }
    else{
      this.setState({openCreateDomain: true, newNameDomain:nameDomain, openDuplicateDomainName:true});
    }
  };



  handleCloseDeleteDomain = () => {
    this.setState({openDeleteDomain: false});
  };

  handleCloseCreateDomain = () => {
    this.setState({openCreateDomain: false, openDuplicateDomainName:false, newNameDomain:"" });
  };

  handleOpenDeleteDomain = () => {
    this.setState({openDeleteDomain: true});
  };

  handleCloseDuplicateDomainName = () => {
    this.setState({openDuplicateDomainName: false});
  };

  handleTextChangeNewNameDomain(e){
    this.setState({ "newNameDomain": e.target.value});
  }

  handleOpenCreateDomain = () => {
    this.setState({openCreateDomain: true});
    this.focusTextField();
  };

  
  render(){
       const actionsCreateDomain = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.handleCloseCreateDomain}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.createNewDomain.bind(this)}
      />,
    ];

    const actionsDeleteDomain = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.handleCloseDeleteDomain}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.deleteDomains.bind(this)}
      />,
    ];

    const actionsDuplicateDomainName = [
      <FlatButton
        label="Ok"
        primary={true}
        onTouchTap={this.handleCloseDuplicateDomainName}
      />,
    ];
  }

}

Home.defaultProps = {
    backgroundColor:"#9A7BB0",
};

export default Home;
