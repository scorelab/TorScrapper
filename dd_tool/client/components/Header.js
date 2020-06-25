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

}