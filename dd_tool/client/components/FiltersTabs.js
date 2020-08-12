import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Export from 'material-ui/svg-icons/file/file-download';
import Dialog from 'material-ui/Dialog';
import ActionAutorenew from 'material-ui/svg-icons/action/autorenew';
import FlatButton from 'material-ui/FlatButton';
import $ from 'jquery';
import CircularProgress from 'material-ui/CircularProgress';
import SwipeableViews from 'react-swipeable-views';
import CheckboxTree from 'react-checkbox-tree';
import IconButton from 'material-ui/IconButton';

class FiltersTabs extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
          slideIndex: 0,
          sessionString:"",
          session: {},
          flat:false,
        };
        this.queryFromSearch=true;
      }
    
      shouldComponentUpdate(nextProps, nextState) {
        this.queryFromSearch = (this.props.queryFromSearch ===undefined)?false:true;
        if(nextProps.updateCrawlerData==="updateCrawler" || nextProps.updateCrawlerData==="stopCrawler" || this.queryFromSearch || this.props.update || JSON.stringify(nextProps.session) !== this.state.sessionString || nextState.slideIndex !== this.state.slideIndex) {
          return true;
        }
        return false;
      }
    
      componentWillReceiveProps(nextProps) {
        if(JSON.stringify(nextProps.session) === this.state.sessionString) {
          this.setState({  flat: true });
          return;
        }
        this.setState({
          session:nextProps.session, sessionString: JSON.stringify(nextProps.session)
        });
    
      }
    
      componentWillMount(){
        this.setState({session:this.props.session, sessionString: JSON.stringify(this.props.session)});
    
      }
      addATerm(checked){
        var sessionTemp = this.props.session;
        var newTerms = checked.toString();
        var labelTerm = "";
        checked.map((term, index)=>{
          labelTerm = labelTerm + term + " OR ";
        });
        if(labelTerm !== "")
          labelTerm = labelTerm.substring(0, labelTerm.length-" OR ".length);
    
        if(newTerms === ""){
          sessionTemp['filter'] = null;
        }
        else {
          if(sessionTemp['selected_queries']!=="" || sessionTemp['selected_tags']!=="" || sessionTemp['selected_tlds']!=="" || sessionTemp['selected_model_tags'] !== ""  || sessionTemp['selected_crawled_tags'] !== ""){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['filter'] = labelTerm;
            sessionTemp['pageRetrievalCriteria'] = {};
            if (sessionTemp['selected_tlds']!=="")
              sessionTemp['pageRetrievalCriteria']['domain'] = sessionTemp['selected_tlds'];
            if(sessionTemp['selected_queries']!=="")
              sessionTemp['pageRetrievalCriteria']['query'] = sessionTemp['selected_queries'];
            if(sessionTemp['selected_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['tag'] = sessionTemp['selected_tags'];
            if(sessionTemp['selected_model_tags']!=="")
                sessionTemp['pageRetrievalCriteria']['model_tag'] = sessionTemp['selected_model_tags'];
            if(sessionTemp['selected_crawled_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['crawled_tag'] = sessionTemp['selected_crawled_tags'];
    
          } else sessionTemp['filter']=labelTerm;
        }
        sessionTemp['selected_aterms']=newTerms;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === ""  && sessionTemp['selected_crawled_tags'] === "" && sessionTemp['selected_tlds'] === ""){
          sessionTemp['pageRetrievalCriteria'] = "Most Recent";
        }
        this.props.updateSession(sessionTemp);
      }

      addTLD(checked){
        var sessionTemp = this.props.session;
        var newTLDs = checked.toString();
    
        if(newTLDs !== ""){
          if(sessionTemp['selected_queries']!=="" || sessionTemp['selected_tags']!=="" || sessionTemp['selected_model_tags']!=="" || sessionTemp['selected_crawled_tags'] !== ""){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['pageRetrievalCriteria'] = {'domain':newTLDs};
            if(sessionTemp['selected_queries']!=="")
              sessionTemp['pageRetrievalCriteria']['query'] = sessionTemp['selected_queries'];
            if(sessionTemp['selected_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['tag'] = sessionTemp['selected_tags'];
            if(sessionTemp['selected_model_tags']!=="")
                sessionTemp['pageRetrievalCriteria']['model_tag'] = sessionTemp['selected_model_tags'];
            if(sessionTemp['selected_crawled_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['crawled_tag'] = sessionTemp['selected_crawled_tags'];
    
          }
          else{
            sessionTemp['newPageRetrievalCriteria'] = "one";
            sessionTemp['pageRetrievalCriteria'] = "TLDs";
          }
        } else if(sessionTemp['newPageRetrievalCriteria'] === "Multi"){
          delete sessionTemp['pageRetrievalCriteria']['domain'];
        }
    
        sessionTemp['selected_tlds']=newTLDs;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === ""  && sessionTemp['selected_crawled_tags'] === "" && sessionTemp['selected_tlds'] === ""){
          sessionTemp['pageRetrievalCriteria'] = "Most Recent";
        }
    
        this.props.updateSession(sessionTemp);
      }
      
      addQuery(checked){
        var sessionTemp = this.props.session;
        var newQuery = checked.toString();
        if(newQuery !== ""){
          if (sessionTemp['selected_tags']!=="" || sessionTemp['selected_tlds']!=="" || sessionTemp['selected_model_tags'] !== "" || sessionTemp['selected_crawled_tags'] !== ""){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['pageRetrievalCriteria'] = {"query":newQuery};
            if(sessionTemp['selected_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['tag'] = sessionTemp['selected_tags'];
            if(sessionTemp['selected_model_tags']!=="")
                sessionTemp['pageRetrievalCriteria']['model_tag'] = sessionTemp['selected_model_tags'];
            if(sessionTemp['selected_crawled_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['crawled_tag'] = sessionTemp['selected_crawled_tags'];
            if(sessionTemp['selected_tlds']!=="")
              sessionTemp['pageRetrievalCriteria']['domain'] = sessionTemp['selected_tlds'];
          }
          else{
            sessionTemp['newPageRetrievalCriteria'] = "one";
            sessionTemp['pageRetrievalCriteria'] = "Queries";
          }
        }else if(sessionTemp['newPageRetrievalCriteria'] === "Multi"){
          delete sessionTemp['pageRetrievalCriteria']['query'];
        }
    
        sessionTemp['selected_queries']=newQuery;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === "" && sessionTemp['selected_crawled_tags'] === "" && sessionTemp['selected_tlds'] === ""){
          sessionTemp['pageRetrievalCriteria'] = "Most Recent";
        }
        this.props.updateSession(sessionTemp);
      }

    render(){
        return(
            <SwipeableViews index={this.state.slideIndex} onChangeIndex={this.handleChange}  >
                <div style={styles.headline}>
                <LoadQueries queryFromSearch={this.queryFromSearch} update={this.props.update} session={this.state.session} addQuery={this.addQuery.bind(this)}  />
                <LoadCrawledData updateCrawlerData={this.props.updateCrawlerData} update={this.props.update} session={this.state.session} addCrawledTags={this.addCrawledTags.bind(this)} />
                <LoadTag update={this.props.update} session={this.state.session} addTags={this.addTags.bind(this)}  />
                <LoadAnnotatedTerms update={this.props.update} session={this.state.session} addATerm={this.addATerm.bind(this)}  />
                <LoadTLDs update={this.props.update} session={this.state.session} addTLD={this.addTLD.bind(this)}  />
                <LoadModel updateStatusMessage={this.props.updateStatusMessage.bind(this)} update={this.props.update} session={this.state.session} addModelTags={this.addModelTags.bind(this)} />
                </div>
	        </SwipeableViews>
        )
    }
}

export default FiltersTabs;