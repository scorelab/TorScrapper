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

class CircularProgressSimple extends React.Component{
  render(){
    return(
    <div style={{borderColor:"green", marginLeft:"50%"}}>
      <CircularProgress size={30} thickness={7} />
    </div>
  );}
}

class LoadQueries extends React.Component {
    constructor(props){
      super(props);
      this.state={
        currentQueries:undefined,
        checked:[],
        expanded:[],
        session: {},
        flat:false,
        queryNodes:[{
            value: 'query',
            label: 'Queries',
            children: [],
        }],
        sfqueryNodes:[{
            value: 'seedfinder',
            label: 'SeedFinder Queries',
            children: [],
        }]
      };
    }
  
    getAvailableQueries(){
      $.post(
        '/getAvailableQueries',
        {'session': JSON.stringify(this.props.session)},
        function(queriesDomain) {
          var selected_queries = [];
          if(this.props.session['selected_queries'] !== undefined && this.props.session['selected_queries'] !== ""){
            selected_queries = this.props.session['selected_queries'].split(",");
          }
          this.setState({currentQueries: queriesDomain, session:this.props.session, checked:selected_queries});
        }.bind(this)
      );
    }
  
    componentWillMount(){
      this.getAvailableQueries();
    }
  
    componentWillReceiveProps(nextProps){
      var array_selected_queries =  (nextProps.session['selected_queries']!=="")?nextProps.session['selected_queries'].split(","):[]; //since this.state.checked is an array, we need that  nextProps.session['selected_tags'] be an array
      if(JSON.stringify(array_selected_queries) === JSON.stringify(this.state.checked) ) {
        if((this.props.update  && this.state.expanded.length > 0) ||  (this.state.expanded.length > 0 && this.props.queryFromSearch)){
          this.getAvailableQueries();
        }
        return;
      }
      var selected_queries = [];
      if(nextProps.session['selected_queries'] !== undefined && nextProps.session['selected_queries'] !== "")
      selected_queries = this.props.session['selected_queries'].split(",");
      this.setState({ session:nextProps.session, checked:selected_queries });
    }
  
    shouldComponentUpdate(nextProps, nextState){
      if(JSON.stringify(nextState.checked) === JSON.stringify(this.state.checked) &&
      JSON.stringify(nextState.currentQueries) === JSON.stringify(this.state.currentQueries) &&
      JSON.stringify(nextState.expanded) === JSON.stringify(this.state.expanded)) {
        if(this.props.update ||  this.props.queryFromSearch){ return true;}
        else {return false;}
      }
      return true;
    }
  
      addQuery(name, object){
      var prev_selected_queries = [];
  
      if(this.state.session['selected_queries'] !== "")
          prev_selected_queries = this.state.session['selected_queries'].split(",");
  
      var checked = [];
      if(name === "seedfinder"){
          checked = object['checked'].map((query, index)=>{
          return "seedfinder:"+query;
          });
          if(prev_selected_queries.length > 0){
          var new_prev_selected = [];
          for(var i = 0;i < prev_selected_queries.length;++i){
              if(!prev_selected_queries[i].includes("seedfinder"))
              new_prev_selected.push(prev_selected_queries[i]);
          }
          checked = (new_prev_selected.length > 0)?new_prev_selected.concat(checked):checked;
          }
  
      }else{
          checked = object["checked"];
          if(prev_selected_queries.length > 0){
          var new_prev_selected = [];
          for(var i = 0;i < prev_selected_queries.length;++i){
              if(prev_selected_queries[i].includes("seedfinder"))
              new_prev_selected.push(prev_selected_queries[i]);
          }
          checked = (new_prev_selected.length > 0)?new_prev_selected.concat(checked):checked;
          }
  
      }
      this.setState({checked: checked });
      this.props.addQuery(checked);
      }
  
    render(){
        if(this.state.currentQueries!==undefined && Object.keys(this.state.currentQueries).length > 0){
        var nodes = this.state.queryNodes;
        var nodesTemp = [];
        nodes.map((node,index)=>{
                if(node.value === "query"){
            node.children = [];
            Object.keys(this.state.currentQueries).map((query, index)=>{
                if(!query.includes("seedfinder")){
                var labelQuery=  query + " (" + this.state.currentQueries[query] + ")"; 
                node.children.push({value:query, label:labelQuery});
                }
            });
                }
                nodesTemp.push(node);
        });
  
        var checked_queries = [];
        for(var i = 0;i < this.state.checked.length;++i){
            var query = this.state.checked[i];
            if(!query.includes("seedfinder"))
            checked_queries.push(query);
        }
  
        var checked_sf_queries = [];
        for(var i = 0;i < this.state.checked.length;++i){
            var query = this.state.checked[i];
            if(query.includes("seedfinder"))
            checked_sf_queries.push(query.replace("seedfinder:",""));
        }
  
        var nodes = this.state.sfqueryNodes;
        var nodesSFTemp = [];
        var seedfinder_queries_found = false;
        nodes.map((node,index)=>{
                if(node.value === "seedfinder"){
            node.children = [];
            Object.keys(this.state.currentQueries).map((query, index)=>{
                if(query.includes("seedfinder")){
                var trunc_query = query.replace("seedfinder:", "");
                var labelQuery=  trunc_query + " (" + this.state.currentQueries[query] + ")";
                node.children.push({value:trunc_query, label:labelQuery});
                seedfinder_queries_found = true;
                }
            });
                }
                nodesSFTemp.push(node);
        });
        var seedfinder_checkbox_tree = <div />;
        if(seedfinder_queries_found){
            seedfinder_checkbox_tree = <CheckboxTree
                        name={"seedfinder"}
                        nodes={nodesSFTemp}
                        checked={checked_sf_queries}
                        expanded={this.state.expanded}
                        onCheck={checked => this.addQuery("seedfinder", {checked})}
                        onExpand={expanded => this.setState({ expanded })}
                        showNodeIcon={false}
                        />;
        }
        return(
                <div >
                <CheckboxTree
        name={"query"}
            nodes={nodesTemp}
            checked={checked_queries}
            expanded={this.state.expanded}
            onCheck={checked => this.addQuery("query", {checked})}
            onExpand={expanded => this.setState({ expanded })}
            showNodeIcon={false}
                />
            {seedfinder_checkbox_tree}
          </div>
        );
      }
      return(
        <div />
      );
    }
  }

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

      addCrawledTags(checked){
        var sessionTemp = this.props.session;
        var newTags = checked.toString();
        if(newTags !== ""){
          console.log("add crawled tags first if");
          if(sessionTemp['selected_queries']!=="" || sessionTemp['selected_tlds']!=="" || sessionTemp['selected_tags'] !== "" || sessionTemp['selected_model_tags']!== "" ){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['pageRetrievalCriteria'] = {'crawled_tag':newTags};
            if(sessionTemp['selected_queries']!=="")
            sessionTemp['pageRetrievalCriteria']['query'] = sessionTemp['selected_queries'];
            if(sessionTemp['selected_tlds']!=="")
            sessionTemp['pageRetrievalCriteria']['domain'] = sessionTemp['selected_tlds'];
            if(sessionTemp['selected_tags']!=="")
            sessionTemp['pageRetrievalCriteria']['tag'] = sessionTemp['selected_tags'];
            if(sessionTemp['selected_model_tags']!=="")
            sessionTemp['pageRetrievalCriteria']['model_tag'] = sessionTemp['selected_model_tags'];
    
          } else{
            console.log("add crawled tags first else");
            sessionTemp['newPageRetrievalCriteria'] = "one";
            sessionTemp['pageRetrievalCriteria'] = "Crawled Tags";
          }
        } else if(sessionTemp['newPageRetrievalCriteria'] === "Multi"){
          console.log("add crawled tags second else");
          delete sessionTemp['pageRetrievalCriteria']['crawled_tag'];
        }
    
        sessionTemp['selected_crawled_tags']=newTags;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === "" && sessionTemp['selected_tlds'] === "" && sessionTemp['selected_crawled_tags'] === ""){
          sessionTemp['pageRetrievalCriteria'] = "Most Recent";
        }
        this.props.updateSession(sessionTemp);
      }

      addTags(checked){
        var sessionTemp = this.props.session;
        var newTags = checked.toString();
        if(newTags !== ""){
          if(sessionTemp['selected_queries']!=="" || sessionTemp['selected_tlds']!=="" || sessionTemp['selected_model_tags'] !== "" || sessionTemp['selected_crawled_tags'] !== ""){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['pageRetrievalCriteria'] = {'tag':newTags};
            if(sessionTemp['selected_queries']!=="")
              sessionTemp['pageRetrievalCriteria']['query'] = sessionTemp['selected_queries'];
            if(sessionTemp['selected_tlds']!=="")
              sessionTemp['pageRetrievalCriteria']['domain'] = sessionTemp['selected_tlds'];
            if(sessionTemp['selected_model_tags']!=="")
                sessionTemp['pageRetrievalCriteria']['model_tag'] = sessionTemp['selected_model_tags'];
            if(sessionTemp['selected_crawled_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['crawled_tag'] = sessionTemp['selected_crawled_tags'];
          }
          else{
            sessionTemp['newPageRetrievalCriteria'] = "one";
            sessionTemp['pageRetrievalCriteria'] = "Tags";
          }
        } else if(sessionTemp['newPageRetrievalCriteria'] === "Multi"){
          delete sessionTemp['pageRetrievalCriteria']['tag'];
        }
        sessionTemp['selected_tags']=newTags;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === ""  && sessionTemp['selected_crawled_tags'] === "" && sessionTemp['selected_tlds'] === ""){
          sessionTemp['pageRetrievalCriteria'] = "Most Recent";
        }
        this.props.updateSession(sessionTemp);
      }

      addModelTags(checked){
        var sessionTemp = this.props.session;
        var newTags = checked.toString();
        if(newTags !== ""){
          if(sessionTemp['selected_queries']!=="" || sessionTemp['selected_tlds']!=="" || sessionTemp['selected_tags'] !== "" || sessionTemp['selected_crawled_tags'] !== ""){
            sessionTemp['newPageRetrievalCriteria'] = "Multi";
            sessionTemp['pageRetrievalCriteria'] = {'model_tag':newTags};
            if(sessionTemp['selected_queries']!=="")
              sessionTemp['pageRetrievalCriteria']['query'] = sessionTemp['selected_queries'];
            if(sessionTemp['selected_tlds']!=="")
              sessionTemp['pageRetrievalCriteria']['domain'] = sessionTemp['selected_tlds'];
            if(sessionTemp['selected_tags']!=="")
                sessionTemp['pageRetrievalCriteria']['tag'] = sessionTemp['selected_tags'];
            if(sessionTemp['selected_crawled_tags']!=="")
              sessionTemp['pageRetrievalCriteria']['crawled_tag'] = sessionTemp['selected_crawled_tags'];
    
          } else{
            sessionTemp['newPageRetrievalCriteria'] = "one";
            sessionTemp['pageRetrievalCriteria'] = "Model Tags";
          }
        } else if(sessionTemp['newPageRetrievalCriteria'] === "Multi"){
          delete sessionTemp['pageRetrievalCriteria']['model_tag'];
        }
    
        sessionTemp['selected_model_tags']=newTags;
        if(sessionTemp['selected_queries'] === "" && sessionTemp['selected_tags'] === "" && sessionTemp['selected_model_tags'] === ""  && sessionTemp['selected_crawled_tags'] === "" && sessionTemp['selected_tlds'] === "" ){
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