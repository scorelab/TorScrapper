import React, {Component} from 'react';

class Body extends Component{
    constructor(props) {
        super(props);
        this.state = {
            transitions: true,
            touch: true,
            shadow: true,
            pullRight: false,
            touchHandleWidth: 20,
            dragToggleDistance: 30,
            size:350,
            offset:0,
            iconDomainInfo:null,
            stateDomainInfoCard:false,
            stateSearchCard:false,
            docked: true,
            open: true,
            currentPagination:0,
            stateFiltersCard:false,
            stateTermsCard:false,
            sizeAvatar:25,
            currentDomain:'',
            sessionBody:{},
            sessionString:"",
      pages:{},
          update:false,
          runCurrentQuery: "*",
          intervalFuncId:undefined,
          stopApplyQueryOverView:false, 
      };
      this.sessionB={};
    }

    createSession(domainId){
        var session = {};
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
        session['search_engine'] = "GOOG";
        session['activeProjectionAlg'] = "Group by Correlation";
        session['domainId'] = domainId;
        session['pagesCap'] = "100";
        session['model'] = {};
        session['model']['positive'] = "Relevant";
        session['model']['negative'] = "Irrelevant";
    
    
    
        return session;
      }

      componentWillReceiveProps  = (newProps) => {
        if(newProps.reloadBody){
          let sessionTemp =  this.state.sessionBody;
          sessionTemp['filter']= (newProps.filterKeyword === '')?null:newProps.filterKeyword;
          this.setState({sessionBody: sessionTemp, sessionString: JSON.stringify(sessionTemp)});
        }
        if(newProps.currentDomain === this.state.currentDomain){
          return;
        }
    
        this.setState({currentDomain: this.props.currentDomain});
    
      };
      
      componentWillMount() {
        this.setState({currentDomain: this.props.currentDomain, sessionBody: this.createSession(this.props.currentDomain), sessionString: JSON.stringify(this.createSession(this.props.currentDomain)) });
      }

    render(){
        if(this.props.selectedViewBody===1) 
    {
      const sidebar = (<div style={{width:this.state.size}}>
      <Col style={{marginTop:70, marginLeft:10, marginRight:10, width:335, background:"white"}}>
            <Row className="Menus-child">
              <DomainInfo nameDomain={this.props.nameDomain} session={this.state.sessionBody} statedCard={this.state.stateDomainInfoCard} sizeAvatar={this.state.sizeAvatar} setActiveMenu={this.setActiveMenu.bind(this)}/>
            </Row>
            <Row className="Menus-child">
             <Search statedCard={this.state.stateSearchCard} sizeAvatar={this.state.sizeAvatar} setActiveMenu={this.setActiveMenu.bind(this)} session={this.state.sessionBody} updatePages={this.updatePages.bind(this)} updateStatusMessage={this.updateStatusMessage.bind(this)} getQueryPages={this.getQueryPages.bind(this)} queryPagesDone={this.queryPagesDone.bind(this)}/>
            </Row>
            <Row className="Menus-child">
              <Filters updateCrawlerData={this.props.updateCrawlerData} queryFromSearch = {this.state.intervalFuncId} update={this.state.update} statedCard={this.state.stateFiltersCard} sizeAvatar={this.state.sizeAvatar} setActiveMenu={this.setActiveMenu.bind(this)} session={this.state.sessionBody} updateStatusMessage={this.updateStatusMessage.bind(this)} updateSession={this.updateSession.bind(this)} deletedFilter={this.deletedFilter.bind(this)}/>
            </Row>
            <Row className="Menus-child">
              <Terms statedCard={this.state.stateTermsCard} sizeAvatar={this.state.sizeAvatar} setActiveMenu={this.setActiveMenu.bind(this)} session={this.state.sessionBody} BackgroundColorTerm={'#DCCCE7'} renderAvatar={true} showExpandableButton={true} actAsExpander={true}/>
            </Row>
            <Row className="Menus-child">
              <FloatingActionButton mini={true}  style={styles.button} zDepth={3} onClick={this.openDockMenu.bind(this)}>
                <Plus />
              </FloatingActionButton>
            </Row>
          </Col>
        </div>
      );

      const sidebarProps = {
        open: this.state.open,
        touch: this.state.touch,
        shadow: this.state.shadow,
        pullRight: this.state.pullRight,
        touchHandleWidth: this.state.touchHandleWidth,
        dragToggleDistance: this.state.dragToggleDistance,
        transitions: this.state.transitions,
        sidebar: sidebar,
        docked: this.state.docked,
        sidebarClassName: 'custom-sidebar-class',
        onSetOpen: this.onSetOpen,
      };

    return (
      <Sidebar {...sidebarProps}>
        <div>
          <Row style={styles.content}>
            <Views queryFromSearch={this.state.intervalFuncId} domainId={this.state.currentDomain} nameDomain={this.props.nameDomain} session={this.state.sessionBody} deletedFilter={this.deletedFilter.bind(this)} reloadFilters={this.reloadFilters.bind(this)} availableCrawlerButton={this.availableCrawlerButton.bind(this)} offset={this.state.offset} currentPagination={this.state.currentPagination} handlePageClick={this.handlePageClick.bind(this)}/>
          </Row>
          </div>
          <Snackbar
        open={this.state.update || this.state.intervalFuncId !== undefined}
        message={this.state.runCurrentQuery}
          //autoHideDuration={(this.state.runCurrentQuery !== "process*concluded" && this.state.runCurrentQuery !== "*" )? 30000: (this.state.runCurrentQuery === "process*concluded")?2000: 0}
        />
        </Sidebar>
      )
    }
    else //crawling view
    {
      return(
        <div>
        <CrawlingView domainId={this.state.currentDomain} statusCrawlers={this.props.statusCrawlers} />
        </div>
      )
    }
    }
}