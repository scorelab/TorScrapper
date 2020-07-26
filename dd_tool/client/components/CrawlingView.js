import React, { Component } from 'react';

class CrawlingView extends Component {
    createSession(domainId){
        var session = {};
        session['search_engine'] = "GOOG";
        session['activeProjectionAlg'] = "Group by Correlation";
        session['domainId'] = domainId;
        session['pagesCap'] = "5";
        session['fromDate'] = null;
        session['toDate'] = null;
        session['filter'] = null; 
        session['pageRetrievalCriteria'] = "Most Recent";
        session['selected_morelike'] = "";
        session['selected_queries']="";
        session['selected_tlds']="";
        session['selected_aterms']="";
        session['selected_tags']="";
        session['selected_model_tags']="";
        session['selected_crawled_tags']="";
        session['model'] = {};
        session['model']['positive'] = ["Relevant"];
        session['model']['negative'] = ["Irrelevant"];
        session["from"]=0;
        return session;
    }
    constructor(props) {
        super(props);
          this.state = {
          disableStopCrawlerSignal:true,
          disableAcheInterfaceSignal:true,
          disabledStartCrawler:false, 
          disabledCreateModel:true, 
          messageCrawler:"",
          openCreateModel: false,
          slideIndex: 0,
          pages:{},
          openDialogLoadUrl: false,
          currentTags:undefined,
          deepCrawlableDomains: [],
          deepCrawlableDomainsFromTag: [],
          resetSelection: false,
          openLoadURLs: false,
          session:{},
          crawlerServers: {},
        };
      }

    componentWillMount(){
        var temp_session = this.createSession(this.props.domainId);
        this.setState({session: temp_session});
        this.getCrawlerServers();
    }

    handleChange = (value) => {
        this.setState({
          slideIndex: value
        });
      }

      getCrawlerServers(){
        $.post(
        '/getCrawlerServers',
        {},
        (crawlerServers) => {
            console.log("CRAWLER SERVERS");
            console.log(crawlerServers);
                this.setState({crawlerServers: crawlerServers});
            this.forceUpdate();
            }
        ).fail((error) => {
            console.log('getCrawlerServers FAILED ', error);
        });
    }
    render() {
      var disableDeepCrawlerButton =false;
      var disableFocusedCrawlerButton = false;
      if(this.props.statusCrawlers!== undefined && this.props.statusCrawlers.length > 0){
        this.props.statusCrawlers.forEach(function(obj){
          if(obj.description==="deep"){
            disableDeepCrawlerButton = (obj.status.toLowerCase() === "running")?true:false;
          }
          if(obj.description==="focused"){
            disableFocusedCrawlerButton = (obj.status.toLowerCase() === "running")?true:false;
          }
        }.bind(this));
      }
  
      return (
        <div style={styles.content}>
          <Tabs
          onChange={this.handleChange}
          value={this.state.slideIndex}
          inkBarStyle={{background: '#7940A0' ,height: '4px'}}
          tabItemContainerStyle={{background:'#9A7BB0', height: '40px'}}>
            <Tab label="Deep crawling" value={0} />
            <Tab label="Focused crawling " value={1} />
          </Tabs>
          <SwipeableViews index={this.state.slideIndex} onChangeIndex={this.handleChange}>
          <div id={"deep-crawling"} style={styles.slide}>
            <DeepCrawling updateCrawlerData={disableDeepCrawlerButton} domainId={this.props.domainId} session={this.state.session} crawlerServers={this.state.crawlerServers}/>
          </div>
  
          <div id="focused-crawling" style={styles.slide}>
            <FocusedCrawling updateCrawlerData={disableFocusedCrawlerButton} domainId={this.props.domainId}  session={this.state.session}  crawlerServers={this.state.crawlerServers} slideIndex={this.state.slideIndex}/>
          </div>
  
          </SwipeableViews>
        </div>
      );
    }
  }
  
  export default CrawlingView;
  