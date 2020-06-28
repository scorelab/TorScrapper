import React, { Component } from 'react';
import Body from './Body';
import Header from './Header';

class Domain extends Component {

    constructor(props) {
    	super(props);
    	this.state = {
    	    idDomain:'',
    	    deleteKeywordSignal:false,
    	    reloadBody:true,
    	    noModelAvailable:true,
    	    updateCrawlerData:"",
    	    filterKeyword:null,
          valueSelectedViewBody:1,
          statusCrawlers:[],
    	};
    };

    selectedViewBody(valueViewBody){
        this.setState({valueSelectedViewBody:valueViewBody});
        this.forceUpdate();
      }

      
    componentWillMount(){
        this.setState({idDomain: this.props.location.query.idDomain});
        };
    
    shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.location.query.idDomain ===this.state.idDomain){
            return false;
        }
        return true;
    };

    componentWillReceiveProps  = (newProps, nextState) => {
        if(newProps.location.query.idDomain ===this.state.idDomain){
            return;
        }
        this.setState({idDomain: this.props.location.query.idDomain});
    };
    
    filterKeyword(newFilterKeyword){
        this.setState({filterKeyword:newFilterKeyword, deleteKeywordSignal:false, reloadBody:true });
        this.forceUpdate();
    }
    
    deletedFilter(filter_Keyword){
        this.setState({ deleteKeywordSignal:true, reloadBody:false });
        this.forceUpdate();
    }

    updateFilterCrawlerData(updateCrawlerData, statusCrawlers){
        this.setState({ updateCrawlerData:updateCrawlerData, reloadBody:true, statusCrawlers:statusCrawlers});
        this.forceUpdate();
   }

   availableCrawlerButton(noModelAvailable){ 
	this.setState({noModelAvailable:noModelAvailable,reloadBody:false });
	this.forceUpdate();
    }
    render() {

	return (
		<div>
		<Header deleteKeywordSignal={this.state.deleteKeywordSignal} currentDomain={this.props.location.query.nameDomain} idDomain={this.props.location.query.idDomain} filterKeyword={this.filterKeyword.bind(this)} noModelAvailable={this.state.noModelAvailable} updateFilterCrawlerData={this.updateFilterCrawlerData.bind(this)} selectedViewBody={this.selectedViewBody.bind(this)}/>
		<Body selectedViewBody={this.state.valueSelectedViewBody} statusCrawlers={this.state.statusCrawlers} updateCrawlerData={this.state.updateCrawlerData} nameDomain={this.props.location.query.nameDomain} currentDomain={this.state.idDomain} filterKeyword={this.state.filterKeyword} deletedFilter={this.deletedFilter.bind(this)} availableCrawlerButton={this.availableCrawlerButton.bind(this)} reloadBody={this.state.reloadBody}/>
		</div>
	);
    }
}

export default Domain;
