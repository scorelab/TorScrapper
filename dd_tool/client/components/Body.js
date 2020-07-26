import React, {Component} from 'react';
import { Row, Col} from 'react-bootstrap';
import DomainInfo from './DomainInfo';
import Search from './Search';
import Filters from './Filters';
import Terms from './Terms';
import Views from './Views';
import CrawlingView from './CrawlingView';
import '../css/Components.css';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import 'react-select/dist/react-select.css';
import Sidebar from 'react-sidebar';
import Plus from 'material-ui/svg-icons/action/swap-horiz';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import Snackbar from 'material-ui/Snackbar'; 

import {Card, CardActions, CardHeader, CardText, CardMedia} from 'material-ui/Card';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';

const styles = {
  button:{
    marginTop:20,
    paddingBottom:'-145px',
    marginBottom:'-545px',
    marginRight: 5,
  },
  contentHeaderMenuLink: {
    textDecoration: 'none',
    color: 'white',
    padding: 8,
  },
  content: {
    marginTop: '68px',
    marginRight: '5px',
    marginBottom: '8px',
    marginLeft: '5px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px 10px 10px 10px',
  },
  avatar:{
    margin:'-4px 8px 0px 0px',
  },

  card: {

    borderStyle: 'solid',
    borderColor: '#C09ED7',
    background: 'white',
    borderRadius: '0px 0px 0px 0px',
    borderWidth: '0px 0px 1px 0px'
  },
  cardHeader:{
    background: '#DCCCE7',
    padding:'10px 1px 10px 6px',
    borderRadius: '0px 0px 0px 0px',
  },
  cardMedia:{
    background: '#DCCCE7',
    padding:'2px 4px 2px 4px',
    borderRadius: '0px 0px 0px 0px',
    height: "200px",
  },
};

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

      openDockMenu(){
        if(this.state.open){
          this.closeMenu();
          this.setState({
            stateDomainInfoCard:false,
            stateSearchCard:false,
            stateFiltersCard:false,
            stateTermsCard:false,
        });}
        else{
          this.openMenu();
          this.setState({
            stateDomainInfoCard:false,
            stateSearchCard:false,
            stateFiltersCard:false,
            stateTermsCard:false,
          });
        }
      }

      openMenu(){
        this.setState({
          size: 350,
          iconDomainInfo:null,
          open: !this.state.open,
          sizeAvatar:25,
        });
      }

      closeMenu(){
        this.setState({
          size: 60,
          open: !this.state.open,
          sizeAvatar:35,
        });
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

      deletedFilter(sessionTemp){
        this.props.deletedFilter(sessionTemp["filter"]);
        this.setState({
            sessionBody:sessionTemp, sessionString: JSON.stringify(sessionTemp), stopApplyQueryOverView:true,
        });
        this.updateSession(sessionTemp);
      }

      applyFilterByQuery(term){
        var session =this.state.sessionBody;
        if(!this.state.stopApplyQueryOverView){
          session['newPageRetrievalCriteria'] = "one";
          session['pageRetrievalCriteria'] = "Queries";
          session['selected_queries']=term;
        }
        this.updateSession(session);
    
      }
      
      reloadFilters(){
        this.setState({update:true});
        this.forceUpdate();
        this.setState({update:false});
      };
      shouldComponentUpdate(nextProps, nextState) {
        if (nextState.sessionString  === this.state.sessionString) {
           if(nextProps.updateCrawlerData=="updateCrawler" || nextProps.updateCrawlerData=="stopCrawler" || nextProps.filterKeyword !== null || nextProps.filterKeyword !== ""   || nextState.stateDomainInfoCard!==this.state.stateDomainInfoCard || nextState.stateSearchCard!==this.state.stateSearchCard || nextState.stateTermsCard!==this.state.stateTermsCard || nextState.stateFiltersCard!==this.state.stateFiltersCard){
             return true;
           }
           return false;
         }
          return true;
      }

      setActiveMenu (expanded, menu) {
        if(!this.state.open){
          this.openMenu();
        }
        var item = menu===0 ? this.setState({stateSearchCard: expanded,  stateFiltersCard :!expanded, stateDomainInfoCard:!expanded, stateTermsCard:!expanded}) :
                   (menu===1 ? this.setState({stateFiltersCard: expanded, stateSearchCard: !expanded, stateDomainInfoCard:!expanded, stateTermsCard:!expanded}) :
                   menu===2 ? this.setState({ stateDomainInfoCard:expanded, stateFiltersCard: !expanded, stateSearchCard: !expanded, stateTermsCard:!expanded}):
                   this.setState({stateTermsCard:expanded, stateDomainInfoCard:!expanded, stateFiltersCard: !expanded, stateSearchCard: !expanded}));
      }

      updateSession(newSession){
        this.setState({sessionBody: newSession , sessionString: JSON.stringify(newSession), stopApplyQueryOverView:true,});
        this.forceUpdate();
      }

      updatePages(pages){
        this.setState({pages:pages});
      }

      queryPagesDone(){
        window.clearInterval(this.state.intervalFuncId);
        this.setState({intervalFuncId:undefined, stopApplyQueryOverView:false,});
      }

      updateStatusMessage(value, term){
        this.setState({update:value, runCurrentQuery: term});
        this.forceUpdate();
    }

    getQueryPages(term){
    if(this.state.intervalFuncId !== undefined)
      this.queryPagesDone();

    this.setState({stopApplyQueryOverView:false, intervalFuncId: window.setInterval(function() {this.applyFilterByQuery(term);}.bind(this), 1000)});

    }
    availableCrawlerButton(isthereModel){
      this.props.availableCrawlerButton(isthereModel);
    }

    handlePageClick(offset, currentPagination){
      this.setState({offset: offset, currentPagination:currentPagination});
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
        />
        </Sidebar>
      )
    }
    else 
    {
      return(
        <div>
        <CrawlingView domainId={this.state.currentDomain} statusCrawlers={this.props.statusCrawlers} />
        </div>
      )
    }
    }
}


export default Body;