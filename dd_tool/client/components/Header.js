import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';

class Header extends Component {

    constructor(props){
        super(props);
        this.state = {
            tagsPosCheckBox:["Relevant"],
            tagsNegCheckBox:["Irrelevant"],
            loadingModel:false,
            processes:{},
            noModelAvailable:true, //the first time we dont have a model
            valueViewBody:1,
            currentDomain:'',
            term:'',
            openInfo:false,
            currentTags:undefined
        };
    
        this.deepCrawlerStopSignal="";
        this.focusedCrawlerSignal="";
        this.deepCrawlerSignal="";
        this.focusedCrawlerStopSignal="";
        this.intervalFuncId = undefined;
    }

    handleCloseCreateModel = () => {
        this.setState({openCreateModel: false});
        this.forceUpdate();
      };
   
      handleCloseCancelCreateModel = () => {
        this.setState({openCreateModel: false});
        this.setState({  tagsPosCheckBox:["Relevant"], tagsNegCheckBox:["Irrelevant"],})
        this.forceUpdate();
      };
   
      handleOpenInfo = () => {
         this.setState({openInfo: true});
         this.forceUpdate();
       };

    handleOnRequestChange = (event, value)=> {
        var session = this.createSession(this.props.idDomain);
        if(value === "2"){
        this.getAvailableTags(session);
        this.setState({ openCreateModel: true });
        }
        else if(value === "1"){
        this.createModel();
        }
    }
 
    handleOpenCreateModel = () => {
      this.setState({openCreateModel: true});
    };
 
     handleCloseInfo = () => {
       this.setState({openInfo: false});
       this.forceUpdate();
     };
 
    componentWillMount(){
        this.setState({currentDomain: this.props.currentDomain,});
        this.setStatusInterval();
    };
  
    
  
      shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.deleteKeywordSignal){ return true; }
        if(nextProps.noModelAvailable !== this.state.noModelAvailable){ return true; }
        if(nextState.term !==this.state.term || nextState.openCreateModel || nextState.openInfo){ return true; }
  
        return false;
      }


    createSession(domainId){
        var session = {};
        session['search_engine'] = "GOOG";
        session['activeProjectionAlg'] = "Group by Correlation";
        session['domainId'] = domainId;
        session['pagesCap'] = "100";
        session['fromDate'] = null;
        session['toDate'] = null;
        session['filter'] = null;//null;
        session['pageRetrievalCriteria'] = "Most Recent";
        session['selected_morelike'] = "";
        session['selected_queries']="";
        session['selected_tlds']="";
        session['selected_aterms']="";
        session['selected_tags']="";
        session['selected_model_tags']="";
        session['model'] = {};
        session['model']['positive'] = ["Relevant"];
        session['model']['negative'] = ["Irrelevant"];
        return session;
     }

     componentWillReceiveProps  = (nextProps) => {
        if(nextProps.deleteKeywordSignal){ this.setState({term:""});}
        if(nextProps.noModelAvailable !== this.state.noModelAvailable ){
            if(!nextProps.noModelAvailable){ 
                this.setState({noModelAvailable:false, disabledStartCrawler:false,  disabledCreateModel:false,});
            }
            else this.setState({noModelAvailable:true, disableStopCrawlerSignal:true, disableAcheInterfaceSignal:true, disabledStartCrawler:true,  disabledCreateModel:true,});
        }
        else {return;}
        }

     componentWillUnmount() {
        this.deepCrawlerSignal="";
        this.deepCrawlerStopSignal="";
        this.focusedCrawlerSignal="";
        this.focusedCrawlerStopSignal="";
        window.clearInterval(this.intervalFuncId);
      }
  
     filterKeyword(terms){
       this.props.filterKeyword(terms);
     }

     stopCrawler(flag){
        var session = this.createSession(this.props.idDomain);
        var message = "Terminating";
        this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler:true, messageCrawler:message,});
        this.forceUpdate();
        $.post(
          '/stopCrawler',
          {'session': JSON.stringify(session)},
        function(message) {
            this.props.updateFilterCrawlerData("stopCrawler");
              this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler: false, messageCrawler:"",});
            this.forceUpdate();
          }.bind(this)
        );
      }

     startCrawler(){
        var session = this.createSession(this.props.idDomain);
        var message = "Running";
        this.setState({disableAcheInterfaceSignal:false, disableStopCrawlerSignal:false, disabledStartCrawler:true, messageCrawler:message});
        this.forceUpdate();
        $.post(
            '/startCrawler',
            {'session': JSON.stringify(session)},
            function(message) {
              var disableStopCrawlerFlag = false;
              var disableAcheInterfaceFlag = false;
              var disabledStartCrawlerFlag = true;
              if(message.toLowerCase() !== "running"){
              disableStopCrawlerFlag = true;
              disableAcheInterfaceFlag =true;
              disabledStartCrawlerFlag = true;
              }
   
              this.props.updateFilterCrawlerData("updateCrawler");
              this.setState({ disableAcheInterfaceSignal: disableAcheInterfaceFlag, disableStopCrawlerSignal:disableStopCrawlerFlag, disabledStartCrawler:disabledStartCrawlerFlag, messageCrawler:message});
              this.forceUpdate();
            }.bind(this)
        );
      }
   
      getAvailableTags(session){
        $.post(
           '/getAvailableTags',
           {'session': JSON.stringify(session), 'event': 'Tags'},
           function(tagsDomain) {
             this.setState({currentTags: tagsDomain['tags']}); //, session:this.props.session, tagString: JSON.stringify(this.props.session['selected_tags'])});
             this.forceUpdate();
           }.bind(this)
         );
      }
      getCreatedModel(session){
        $.post(
           '/createModel',
           {'session': JSON.stringify(session)},
           function(model_file) {
             var url = model_file;
             window.open(url,'Download');
             this.setState({loadingModel:false, disabledCreateModel:false})
             this.forceUpdate();
           }.bind(this)
         );
      }
      //Create model
      createModel(){
        var session = this.createSession(this.props.idDomain); //createNewDomain
        this.setState({loadingModel:true, disabledCreateModel:true});
        this.forceUpdate();
        this.getCreatedModel(session);
      };
   
      addPosTags(tag){
         var tags = this.state.tagsPosCheckBox;
         if(tags.includes(tag)){
           var index = tags.indexOf(tag);
           tags.splice(index, 1);
         }
         else{
           tags.push(tag);
         }
         this.setState({tagsPosCheckBox:tags})
         this.forceUpdate();
      }
   
      addNegTags(tag){
         var tags = this.state.tagsNegCheckBox;
         if(tags.includes(tag)){
           var index = tags.indexOf(tag);
           tags.splice(index, 1);
         }
         else{
           tags.push(tag);
         }
         this.setState({tagsNegCheckBox:tags})
         this.forceUpdate();
      }
   
      handleOnRequestChange = (event, value)=> {
          var session = this.createSession(this.props.idDomain);
          if(value === "2"){
       this.getAvailableTags(session);
       this.setState({ openCreateModel: true });
          }
          else if(value === "1"){
       this.createModel();
          }
      }
   
      handleChangeViewBody = (event, index, valueViewBody) => {
        this.setState({valueViewBody:valueViewBody});
        this.props.selectedViewBody(valueViewBody);
      }
   
      acheInterfaceCrawler(flag){
        var session = this.createSession(this.props.idDomain);
        var message = "Terminating";
        this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler:true, messageCrawler:message,});
        this.forceUpdate();
        $.post(
          '/stopCrawler',
          {'session': JSON.stringify(session)},
          function(message) {
            this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler: false, messageCrawler:""});
            this.forceUpdate();
          }.bind(this)
        );
      }

      getStatus(){
        var session = this.createSession(this.props.idDomain);
        $.post(
            '/getStatus',
            {'session': JSON.stringify(session)},
            function(result) {
            var status = JSON.parse(JSON.stringify(result));
            var disableStopCrawlerFlag = true;
            var disableAcheInterfaceFlag =true;
            var disabledStartCrawlerFlag = false;
            var disabledCreateModelFlag = false;
            if(obj.description==="deep"){
                var message = obj.status;
                      if( message !== undefined){
                        if(message.toLowerCase() === "running"){
                    if(this.deepCrawlerSignal!=="deep") {
                      this.props.updateFilterCrawlerData("updateCrawler", status.Crawler);
                    }
                    this.deepCrawlerSignal="deep";
                  }
                  else if(message.toLowerCase() === "terminating"){
                    if(this.deepCrawlerStopSignal!=="deep stop") {
                      this.props.updateFilterCrawlerData("stopCrawler",status.Crawler);
                    }
                    this.deepCrawlerStopSignal="deep stop";
                        }
                }
              }
            if(status !== undefined && Object.keys(status).length > 0) {
              if(status.Crawler !== undefined && status.Crawler.length > 0){
            status.Crawler.forEach(function(obj){
              if(obj.description==="focused"){
                var message = obj.status;
                      if( message !== undefined){
                        if(message.toLowerCase() === "running"){
                    if(this.focusedCrawlerSignal!=="focused"){
                      this.props.updateFilterCrawlerData("updateCrawler",status.Crawler);
                    }
                    this.focusedCrawlerSignal="focused";
                  }
                  else if(message.toLowerCase() === "terminating"){
                    if(this.focusedCrawlerStopSignal!=="focused stop") {
                      this.props.updateFilterCrawlerData("stopCrawler",status.Crawler);
                    }
                    this.focusedCrawlerStopSignal="focused stop";
                        }
                }
              }
              if(this.state.noModelAvailable){
                disabledStartCrawlerFlag = true;
                disabledCreateModelFlag = true;
            }
            }.bind(this));
    
                  var message = status.Crawler[0].status;
                  if( message !== undefined){
                    if(message.toLowerCase() === "running"){
                        disableStopCrawlerFlag = false;
                        disableAcheInterfaceFlag =false;
                        disabledStartCrawlerFlag = true;
                    }else if(message.toLowerCase() === "terminating"){
                        disabledStartCrawlerFlag = true;
                    }
                    if(this.props.currentDomain !== status.Crawler[0].domain){
                      disableStopCrawlerFlag = true;
                      disableAcheInterfaceFlag =true;
                      disabledStartCrawlerFlag = true;
                      message = message +" in domain: " +  status.Crawler[0].domain;
                    }
                    this.setState({processes: status, disableAcheInterfaceSignal:disableAcheInterfaceFlag, disableStopCrawlerSignal:disableStopCrawlerFlag, disabledStartCrawler:disabledStartCrawlerFlag, disabledCreateModel: disabledCreateModelFlag, messageCrawler:message, });
                    this.forceUpdate();
                  }
               } else {
                this.setState({processes: status, disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler: disabledStartCrawlerFlag, disabledCreateModel: disabledCreateModelFlag, messageCrawler:"", });
                this.forceUpdate();
                }
            }else {
                this.setState({processes: status, disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler: disabledStartCrawlerFlag, disabledCreateModel:disabledCreateModelFlag,  messageCrawler:"", });
                this.forceUpdate();
            }
            }.bind(this)
        );
        }
    
       setStatusInterval(){
           this.intervalFuncId = window.setInterval(function() {this.getStatus();}.bind(this), 1000);
       }

       render() {
        const actionsCreateModel = [
                                    <FlatButton label="Cancel" primary={true} onTouchTap={this.handleCloseCancelCreateModel} />,
                                    <FlatButton label="Save"   primary={true} keyboardFocused={true} onTouchTap={this.handleCloseCreateModel} />,
                                   ];
       const actionsShowInfo = [
                                   <FlatButton label="Ok" primary={true}   keyboardFocused={true} onTouchTap={this.handleCloseInfo} />,
                                  ];
   
        var checkedTagsPosNeg = (this.state.currentTags!==undefined) ?
                                <div>
                                  <p>Positive</p>
                                    {Object.keys(this.state.currentTags).map((tag, index)=>{
                                      var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                                      var checkedTag=false;
                                      var tags = this.state.tagsPosCheckBox;
                                      if(tags.includes(tag))
                                         checkedTag=true;
                                      return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addPosTags.bind(this,tag)} />
                                    })}
                                 <p>Negative</p>
                                    {Object.keys(this.state.currentTags).map((tag, index)=>{
                                      var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                                      var checkedTag=false;
                                      var tags = this.state.tagsNegCheckBox;
                                      if(tags.includes(tag))
                                      checkedTag=true;
                                      return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addNegTags.bind(this,tag)} />
                                    })}
                                  </div>:<div />;
   
        var loadingModel = (this.state.loadingModel)?<CircularProgress style={{marginTop:15, marginLeft:"-30px"}} size={20} thickness={4} />: <div/>;
        var crawlingProgress = (this.state.disableStopCrawlerSignal)?<div />: <CircularProgress style={{marginTop:15, marginLeft:"-10px"}} size={20} thickness={4} />;
        var messageCrawlerRunning = (this.state.disabledStartCrawler)?<div style={{marginTop:15, fontFamily:"arial", fontSize:14 , fontWeight:"bold"}}>{this.state.messageCrawler} </div>:"";
        var switchDomain = <RaisedButton
                                    label="Switch Domain"
                                    labelStyle={{textTransform: "capitalize"}}
                                    backgroundColor={this.props.backgroundColor}
                                    icon={<SwitchDomain />}
                                    style={{marginRight:"-10px",marginTop:6, height:30}}
                                  />;
        var infoCrawlerRunning = <RaisedButton
                                    label="Monitoring"
                                    labelStyle={{textTransform: "capitalize"}}
                                    backgroundColor={this.props.backgroundColor}
                                    icon={<MonitoringIcon />}
                                    style={{marginLeft:"-10px", marginTop:6, height:30}}
                                    onTouchTap={this.handleOpenInfo.bind(this)}
                                  />;
        var crawlerStop = (this.state.disableStopCrawlerSignal)?<div/>:<RaisedButton  onClick={this.stopCrawler.bind(this, true)} style={{height:20, marginTop: 15, minWidth:58, width:48}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
                                                                                      label="Stop" labelPosition="before" containerElement="label"/>;
        var crawlerAcheInterface = (this.state.disableStopCrawlerSignal)?<div/>:<IconButton tooltip="Click to open ACHE Interface"
                                     href="http://localhost:8080/" target="_blank" style={{height:20, marginLeft: "-20px", minWidth:58, width:48}} tooltipStyles={{fontSize:14, fontWeight:"bold"}}
                                   >
                                     <OpenInNewTab />
                                   </IconButton>;
   
        return (
           <AppBar showMenuIconButton={true} style={styles.backgound} title={<span style={styles.titleText}> Domain Discovery Tool </span>}
            titleStyle={{width:40, margin:0, padding:0,}}  iconElementLeft={<img alt="logo NYU" src={logoNYU}  height='45' width='40'  />} >
             <Toolbar style={styles.toolBarHeader}>
             <ToolbarTitle text={this.state.currentDomain} style={styles.tittleCurrentDomain}/>
             <Link to='/'>
             {switchDomain}
             </Link>
              <DropDownMenu value={this.state.valueViewBody} onChange={this.handleChangeViewBody.bind(this)} style={{marginTop:"-6px", height:43}}
              underlineStyle={{borderColor:this.props.backgroundColor}}
              labelStyle={{color:"#323232", fontSize:14, fontWeight:'bold',}} selectedMenuItemStyle={{color:"#9A7BB0"}}
              iconStyle={{fill:"#5a4868"}} anchorOrigin={{vertical: 'bottom', horizontal: 'left',}} targetOrigin={{vertical: 'bottom', horizontal: 'left',}}>
                <MenuItem value={1} primaryText="Explore Data View" />
                <MenuItem value={2} primaryText="Crawling View" />
             </DropDownMenu>
               {infoCrawlerRunning}
             <TextField
             style={{width:"19%", marginRight:"-15px", marginTop:4, height: 35, borderColor: 'gray', borderWidth: 1, background:"white", borderRadius:"5px"}}
             floatingLabelFixed={true} floatingLabelText={ <Search color={"silver"} />} floatingLabelStyle={{marginTop:"-8px", marginLeft:3, }}
             hintText="Search ..."
             hintStyle={{marginBottom:"-8px", marginLeft:25}}
             inputStyle={{ width:"80%", marginTop:0, marginBottom:10, marginLeft:25}} underlineShow={false}
             value={this.state.term} onKeyPress={(e) => {(e.key === 'Enter') ? this.filterKeyword(this.state.term) : null}} onChange={e => this.setState({ term: e.target.value })}
             />
             <Dialog title=" Model Settings" actions={actionsCreateModel} modal={false} open={this.state.openCreateModel} onRequestClose={this.handleCloseCreateModel.bind(this)}>
                {checkedTagsPosNeg}
             </Dialog>
             <Dialog title="Monitoring processes" actions={actionsShowInfo} modal={false} open={this.state.openInfo} onRequestClose={this.handleCloseInfo.bind(this)}>
             <Monitoring processes={this.state.processes} updateFilterCrawlerData={this.props.updateFilterCrawlerData.bind(this)} />
             </Dialog>
             </Toolbar>
           </AppBar>
         );
       }
}

Header.defaultProps = {
    backgroundColor:"#9A7BB0",
};

export default Header;