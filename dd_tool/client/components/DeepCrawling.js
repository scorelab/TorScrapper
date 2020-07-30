import React, { Component } from 'react';
import { Col, Row} from 'react-bootstrap';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import RemoveURL from 'material-ui/svg-icons/navigation/cancel';
import LoadExternalUrls from 'material-ui/svg-icons/file/file-upload';
import AddRecommendationUrls from 'material-ui/svg-icons/content/add-circle-outline';
import IconButton from 'material-ui/IconButton';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Divider from 'material-ui/Divider';

import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
  } from 'material-ui/Table';
  import $ from 'jquery';
  
  import MultiselectTable from './MultiselectTable';
  
  const PAGE_COUNT = 2000000

class DeepCrawling extends Component {

     addDomainsForDeepCrawl(event) {
	var aux_deepCrawlableDomains = [];
	this.selectedRows.forEach((rowIndex) => {
	    if(this.state.deepCrawlableDomains.indexOf(this.state.recommendations[rowIndex][0]) === -1)
		aux_deepCrawlableDomains.push(this.state.recommendations[rowIndex][0]);
	});

	var session = this.props.session;
	session['newPageRetrievalCriteria'] = "one";
	session['pageRetrievalCriteria'] = "TLDs";
	session['selected_tlds']=aux_deepCrawlableDomains.join(",");
	session['pagesCap']=PAGE_COUNT;

	$.post(
	    '/getPages',
	    {'session': JSON.stringify(session)},
	    function(pages) {
		var urlsfromRecommendations = Object.keys(pages["data"]["results"]).map(result=>{return result;});
		this.setState({deepCrawlableUrls: urlsfromRecommendations.concat(this.state.deepCrawlableUrls)});
		this.forceUpdate();
	    }.bind(this)
	);


	this.setState({
	    deepCrawlableDomains: aux_deepCrawlableDomains.concat(this.state.deepCrawlableDomains),
	    resetSelection: true
	});
    }
    addDomainsOnSelection(selectedRows) {
        this.selectedRows = selectedRows;
      }
    
      addDomainsForDeepCrawl(event) {
        var aux_deepCrawlableDomains = [];
        this.selectedRows.forEach((rowIndex) => {
            if(this.state.deepCrawlableDomains.indexOf(this.state.recommendations[rowIndex][0]) === -1)
            aux_deepCrawlableDomains.push(this.state.recommendations[rowIndex][0]);
        });
    
        var session = this.props.session;
        session['newPageRetrievalCriteria'] = "one";
        session['pageRetrievalCriteria'] = "TLDs";
        session['selected_tlds']=aux_deepCrawlableDomains.join(",");
        session['pagesCap']=PAGE_COUNT;
    
        $.post(
            '/getPages',
            {'session': JSON.stringify(session)},
            function(pages) {
            var urlsfromRecommendations = Object.keys(pages["data"]["results"]).map(result=>{return result;});
            this.setState({deepCrawlableUrls: urlsfromRecommendations.concat(this.state.deepCrawlableUrls)});
            this.forceUpdate();
            }.bind(this)
        );
    
    
        this.setState({
            deepCrawlableDomains: aux_deepCrawlableDomains.concat(this.state.deepCrawlableDomains),
            resetSelection: true
        });
        }
      addDomainsFromFileForDeepCrawl() {
        let aux_deepCrawlableUrls = this.state.deepCrawlableUrls;
        var aux_valueLoadUrls = (this.state.valueLoadUrls!==undefined)?this.state.valueLoadUrls:[];
        var valueLoadUrlsFromTextField = (this.state.valueLoadUrlsFromTextField!==undefined)?((this.state.valueLoadUrlsFromTextField!=="")?this.state.valueLoadUrlsFromTextField.split(/\r\n|\n/):[]):[];
    
        valueLoadUrlsFromTextField.forEach((value) => {
          aux_valueLoadUrls.push(value);
        });
        aux_valueLoadUrls.forEach((value) => {
          aux_deepCrawlableUrls.push(value);
        })
        this.setState({
          deepCrawlableUrls: aux_deepCrawlableUrls,
          resetSelection: true,
          valueLoadUrls:[],
          valueLoadUrlsFromTextField:"",
        });
      }
    getPages(session){
        $.post(
          '/getPages',
          {'session': JSON.stringify(session)},
          function(pages) {
            var urlsfromDeepCrawlTag = this.getCurrentUrlsfromDeepCrawlTag(pages["data"]["results"]);
            this.setState({deepCrawlableDomainsFromTag: urlsfromDeepCrawlTag,});
            this.forceUpdate();
          }.bind(this)
        );
      }
    
      getCurrentUrlsfromDeepCrawlTag(pages){
        var urlsList = {};
        var urlsList2 =  (Object.keys(pages).length>0)? Object.keys(pages)
                            .map((k, index)=>{ urlsList[k]=""; }) : {};
        return Object.keys(urlsList)
                  .map(reco => [reco, urlsList[reco]])
                  .sort((a, b) => ((a[1] > b[1]) ? -1 : ((a[1] < b[1]) ? 1 : 0)));
      }
    
      getRecommendations() {
        $.post(
          '/getRecommendations',
          { session: JSON.stringify(this.props.session), minCount: this.state.minURLCount || 10},
          (response) => {
          var recommendations = Object.keys(response || {})
                      .map(reco => [reco, response[reco]])
                      .sort((a, b) => {
              if(b[1]['score'] === undefined)
                  return (b[1]['count'] - a[1]['count']);
              else {
                  if(parseFloat(b[1]['score'].toFixed(3)) === parseFloat(a[1]['score'].toFixed(3)))
                  return (b[1]['count'] - a[1]['count']);
                  else return (b[1]['score'] - a[1]['score']);
              };
              });
              this.setState({recommendations: recommendations})
            }
        ).fail((error) => {
            console.log('getRecommendations FAILED ', error);
        });
    }

    componentWillUnmount() {
        clearInterval(this.recommendationInterval)
      }

      componentWillMount(){
        var update_disabledStartCrawler = (this.props.updateCrawlerData)?true:false;
        this.setState({session:this.props.session, disabledStartCrawler:update_disabledStartCrawler,});
        this.forceUpdate();
        var session = this.props.session;
        session['newPageRetrievalCriteria'] = "one";
        session['pageRetrievalCriteria'] = "Tags";
        session['selected_tags']="Deep Crawl";
        session['pagesCap']=PAGE_COUNT;
        this.getPages(session);
        this.getRecommendations();
    }

    constructor(props) {
        super(props);
          this.state = {
          disableStopCrawlerSignal:false,
          disableAcheInterfaceSignal:true,
          disabledStartCrawler:false, 
          disabledCreateModel:true, 
          messageCrawler:"",
          recommendations: [],
          minURLCount: 10,
          pages:{},
          openDialogLoadUrl: false,
          deepCrawlableDomains: [],
          deepCrawlableUrls: [],
          deepCrawlableDomainsFromTag: [],
          resetSelection: false,
          openLoadURLs: false,
          session:"",
          nameFile:"",
          openDialogStatusCrawler:false,
          messageErrorCrawler:'',
        };
        this.selectedRows = [];
        this.recommendationInterval = null;
        this.addDomainsForDeepCrawl = this.addDomainsForDeepCrawl.bind(this);
        this.addDomainsOnSelection = this.addDomainsOnSelection.bind(this);
        this.startDeepCrawler = this.startDeepCrawler.bind(this);
        this.stopDeepCrawler = this.stopDeepCrawler.bind(this);
        this.addUrlsWhileCrawling = this.addUrlsWhileCrawling.bind(this);
    
        this.changeMinURLCount = this.changeMinURLCount.bind(this);
        this.handleOpenDialogLoadUrl = this.handleOpenDialogLoadUrl.bind(this);
        this.handleCloseDialogStatusCrawler = this.handleCloseDialogStatusCrawler.bind(this);
    
      }
    render() {
        return (
            <Row>
            <Col xs={6} md={6} style={{marginLeft:'0px'}}>
            <Card>
             <CardHeader
               title="DOMAINS FOR CRAWLING"
               actAsExpander={false}
               showExpandableButton={false}
               style={{fontWeight:'bold', marginBottom:"-70px"}}
             />
             <CardText expandable={false} >
                <Table id={"Annotated urls"} height={"255px"} selectable={false} multiSelectable={false} >
                <TableHeader displaySelectAll={false} enableSelectAll={false} >
                  <TableRow>
                    <TableHeaderColumn >
                    </TableHeaderColumn>
                  </TableRow>
                  <TableRow style={heightTableStyle}>
                    <TableHeaderColumn colSpan="1" style={{textAlign: 'center'}}>
                      Annotated urls
                    </TableHeaderColumn>
                  </TableRow>
                </TableHeader>
                <TableBody showRowHover={false} displayRowCheckbox={false} deselectOnClickaway={false} stripedRows={false}>
                {
                  (this.state.deepCrawlableDomainsFromTag || []).map((row, index) => (
                    <TableRow displayBorder={false} key={index} style={heightTableStyle}>
                    <TableRowColumn style={heightTableStyle}>{row}</TableRowColumn>
                    </TableRow>
                  ))
                }
                </TableBody>
                </Table>
      
                <Table id={"Added urls to deep crawl"} style={{marginTop:"0px", }} height={"180px"} selectable={false} multiSelectable={false} >
                <TableHeader displaySelectAll={false} enableSelectAll={false} >
                  <TableRow>
                    <TableHeaderColumn >
                    </TableHeaderColumn>
                  </TableRow>
                  <TableRow>
                    <TableHeaderColumn colSpan="2" style={{textAlign: 'center'}}>
                      Added urls to deep crawl
                    </TableHeaderColumn>
                  </TableRow>
                </TableHeader>
                <TableBody displayRowCheckbox={false} deselectOnClickaway={false} showRowHover={true} stripedRows={false}>
                {
                  (this.state.deepCrawlableUrls).map((row, index) => (
                    <TableRow key={index}>
                    <TableRowColumn width={450} >{row}</TableRowColumn>
                    <TableRowColumn width={90} style={{textAlign: 'right'}}>
                      <div>
                        <IconButton onClick={this.handleRemoveUrlFromList.bind(this,row, index )} tooltip="Remove" touch={true} tooltipPosition="bottom-right" tooltipStyles={{marginTop:"-53px",marginLeft:"-73px", fontSize:11,}}>
                          <RemoveURL />
      
                        </IconButton>
                      </div>
                    </TableRowColumn>
                    </TableRow>
                  ))
                }
                </TableBody>
                </Table>
              </CardText>
            </Card>
              <Row>
                <Col xs={4} md={4} style={{marginLeft:'0px'}}>
                  <RaisedButton
                    label="Start Crawler"
                    labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                    backgroundColor={this.props.backgroundColor}
                    disable={this.state.disabledStartCrawler}
                    style={
                            this.state.disabledStartCrawler ?
                            {pointerEvents: 'none', opacity: 0.5, height:35, marginTop: 0, margin: 12}
                            :
                            {pointerEvents: 'auto', opacity: 1.0, height:35, marginTop: 0, margin: 12}
                          }
                    onClick={this.startDeepCrawler}
                  />
                </Col>
                {
                  this.state.disabledStartCrawler ?
                  <Col xs={9} md={9} style={{marginLeft:'-70px'}}>
                    <RaisedButton
                      label="Add URLs"
                      labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                      backgroundColor={this.props.backgroundColor}
                      style={{height:35, marginTop: 0, margin: 12}}
                      onClick={this.addUrlsWhileCrawling}
                    />
                    <RaisedButton
                      label="Crawler Monitor"
                      labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                      backgroundColor={this.props.backgroundColor}
                      style={{height:35, marginTop: 0, margin: 12}}
                      href={this.props.crawlerServers['deep']+"/monitoring"} target="_blank"
                    />
                    <RaisedButton
                      label="Stop Crawler"
                      labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                      backgroundColor={this.props.backgroundColor}
                      style={{height:35, marginTop: 0, margin: 12}}
                      onClick={this.stopDeepCrawler}
                    />
                    </Col>
      
                  :
                  null
                }
      
              </Row>
            </Col>
      
            <Col xs={6} md={6} style={{marginLeft:'0px'}}>
              <Card id={"Recommendations"} initiallyExpanded={true} >
               <CardHeader
                 title="Add urls to deep crawl from recommendations"
                 actAsExpander={false}
                 showExpandableButton={false}
                 style={{fontWeight:'bold', marginBottom:"-70px",}}
               />
      
               <CardText >
                 <div style={{display: 'flex', float: 'right', marginBottom: '-10px'}}>
                   <div style={{marginTop: '15px', marginRight: '19px'}}>
                    Min URLs in Domain
                   </div>
                   <div>
                     <TextField
                       ref={(element) => {this.minRecoInput = element;}}
                       type='number'
                       style={{width: "100px", marginBottom: "-70px", float: "right", padding: "0px"}}
                       value={this.state.minURLCount}
                       onChange={this.changeMinURLCount}
                       onKeyPress={(e) => {(e.key === 'Enter') ? this.getRecommendations(this) : null}}
                      />
                    </div>
                  </div>
              </CardText>
               <CardText expandable={false} style={{marginTop:"0px",}}>
                  <Divider style={{marginTop:20,}}/>
                  <MultiselectTable
                    rows={this.state.recommendations}
                    columnHeadings={["RECOMMENDED DOMAIN", "SCORE, COUNT"]}
                    onRowSelection={this.addDomainsOnSelection}
                    resetSelection={this.state.resetSelection}
                  />
                  <RaisedButton
                    label="Add to deep crawl"
                    labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                    backgroundColor={this.props.backgroundColor}
                    icon={<AddRecommendationUrls />}
                    style={{height:35, marginTop: 12}}
                    onClick={this.addDomainsForDeepCrawl}
                  />
                </CardText>
               </Card>
      
              <Card id={"Load external urls"} initiallyExpanded={true} >
               <CardHeader
                title="Add urls to deep crawl from external URLs"
                 actAsExpander={false}
                 showExpandableButton={false}
                 style={{fontWeight:'bold', marginBottom:"-18px"}}
               />
               <CardText expandable={true} >
               <RaisedButton
                  label="Loading external urls"
                  labelStyle={{textTransform: "capitalize", fontSize:14, fontWeight:"normal"}}
                  backgroundColor={this.props.backgroundColor}
                  icon={<LoadExternalUrls />}
                  style={{height:35, marginTop: "-15px", marginBottom:"-8px"}}
                  disabled={false}
                  onClick={this.handleOpenDialogLoadUrl}
                />
               <Dialog title="Adding urls" actions={actionsLoadUrls} modal={false} open={this.state.openDialogLoadUrl} onRequestClose={this.handleCloseDialogLoadUrl.bind(this)}>
                 <Row>
                 <Col xs={10} md={10} style={{marginLeft:'0px'}}>
                   <TextField style={{height:200, width:'260px', fontSize: 12, marginRight:'-80px', marginTop:5, border:'solid',  Color: 'gray', borderWidth: 1, background:"white", borderRadius:"5px"}}
                     onChange={this.handleTextChangeLoadUrls.bind(this)}
                     floatingLabelText="Write urls (one by line)."
                     hintStyle={{ marginLeft:30}}
                     textareaStyle={{marginTop:30,}}
                     inputStyle={{ height:180, marginBottom:10, marginLeft:10, paddingRight:20}}
                     multiLine={true}
                     rows={6}
                     rowsMax={6}
                     floatingLabelStyle={{marginLeft:10, marginRight:30,}}
                     underlineStyle={{width:210, marginLeft:30, marginRight:30,}}
                   />
                 </Col>
                 </Row>
                 <Row>
                   <br />
                   <div>
                     <FlatButton style={{ height:35, marginLeft:15, marginTop: 0}}
                       buttonStyle={{height:35}}
                       labelStyle={{textTransform: "capitalize", fontSize:14, color:"white", fontWeight:"normal"}}
                       backgroundColor="#26C6DA"
                       hoverColor="#80DEEA"
                       label="Choose URLs File"
                       labelPosition="before"
                       containerElement="label"
                     >
                       <input type="file" id="csvFileInput" placeholder="Load queries from file" style={{marginTop:10, lineHeight: "1ex"}} onChange={this.handleFile.bind(this)} name='file' ref='file' accept=".txt" style={{display:"none",}}/>
                     </FlatButton>
                     <span style={{position:"absolute", margin:"7px 7px 7px 10px"}}>{this.state.nameFile}</span>
                    </div>
                 </Row>
               </Dialog>
               <Dialog title="Status Deep Crawler" actions={actionsStatusCrawler} modal={true} open={this.state.openDialogStatusCrawler} onRequestClose={this.handleCloseDialogStatusCrawler.bind(this)}>
                  {this.state.messageErrorCrawler}
               </Dialog>
               </CardText>
              </Card>
            </Col>
            </Row>
        );
    }
}