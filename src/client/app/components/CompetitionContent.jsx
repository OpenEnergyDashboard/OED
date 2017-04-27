import React from 'react';
import CompetitionBuilding from './CompetitionBuilding';
import moment from 'moment';

 export default class CompetitionComponent extends React.Component {
 	/**
 	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
 	 * @param props The props passed down through the UIOptionsContainer
 	 */
 	constructor(props) {
 		super(props);
    this.state={
     current:"1",
     next:"2",
     buildingOn:1,
     id1:1,
     id2:2,
     data:[],
     currentGraph:"week"
    }
 	}

 	/**
 	 * Called when this component mounts
 	 * Dispatches a Redux action to fetch meter information
 	 */
 componentWillReceiveProps(nextProps) {
   if(nextProps.data.datasets.length!=0){
     this.filterDataforGraph(nextProps,this.state.currentGraph);

   }
 // 	for (const meterID of nextProps.notLoadedMeters) {
 // 		nextProps.fetchNewReadings(meterID, nextProps.startTimestamp, nextProps.endTimestamp);
 // 	}
 // 	  this.setState({series:nextProps.series});
 	}
filterDataforGraph(prop,type){
  let currentGraph = type;
  let daysToSubstract = 0;
  switch (type) {
    case "week":
      daysToSubstract=7;
      break;
    case "month":
      daysToSubstract=30;
      break;
    case "day":
      daysToSubstract=7;
      break;
  }
  //find latest time
    let currentTime = prop.data.datasets[0]['data'][prop.data.datasets[0]['data'].length-1]['x'];
    const startThisWeek = moment(currentTime).startOf(currentGraph);
    const startLastWeek = moment(currentTime).startOf(currentGraph).subtract(daysToSubstract,'days');
    const dayThisWeek =moment(currentTime);
    const dayLastWeek =moment(currentTime).subtract(daysToSubstract,'days');
    let pastWeekTotal=0;
    let pastWeekEqul=0;
    let thisWeekEqul=0;
    let data=[];
    if(type=="week"||type=="month"){
    for (const reading of prop.data.datasets[0]['data']) {
     if (moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(startThisWeek)) {
       pastWeekTotal+=parseFloat(reading['y']);
       if(moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(dayLastWeek)){
         pastWeekEqul+=parseFloat(reading['y']);
       }
     }else if(moment(reading['x']).isAfter(startThisWeek)&&moment(reading['x']).isBefore(dayThisWeek)){
         thisWeekEqul+=parseFloat(reading['y']);
       }

   }
   let projectedThisWeek = thisWeekEqul/(pastWeekEqul/pastWeekTotal);

   data = [[pastWeekEqul,thisWeekEqul],[pastWeekTotal-pastWeekEqul,projectedThisWeek-thisWeekEqul],projectedThisWeek-pastWeekTotal];
   }
    //  else if(type=="day"){
    //    let plotLabel=[];
    //    let pastValue=[];
    //    for (const reading of prop.data.datasets[0]['data']) {
    //     if (moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(moment(startLastWeek).endOf("day"))) {
    //       pastWeekTotal+=parseFloat(reading['y']);
    //       plotLabel.push(reading['x']);
    //       pastValue.push(reading['y']);
    //       // if(moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(dayLastWeek)){
    //       //   pastWeekEqul+=parseFloat(reading['y']);
    //       // }
    //     }
    //     // else if(moment(reading['x']).isAfter(startThisWeek)&&moment(reading['x']).isBefore(dayThisWeek)){
    //     //     thisWeekEqul+=parseFloat(reading['y']);
    //     //   }
     //
    //   }
    //   data=[plotLabel,pastValue];
    //  }

   this.setState({data:data});

}
componentWillMount(){
  let selectedMeters = [];
  selectedMeters.push(parseInt(1));
  this.props.selectMeters(selectedMeters,"all");
  this.props.fetchMetersDataIfNeeded();
// this.props.fetchNewReadings(1,this.props.startTimestamp,this.props.endTimestamp);
// alert(this.props.series['data']);

//
// if(this.props.data.datasets.length!=0){
//   const startThisWeek = moment().startOf('week');
//   const startLastWeek = moment().startOf('week').subtract(7,'days');
//   const dayThisWeek = moment();
//   const dayLastWeek = moment().subtract(7,'days');
//   let data1=[];
//   let data2=[];
//     alert("defined");
//     // let pastWeekTotal = this.props.data.datasets[d].map(reading =>
//     //   <li className="navLi " key={meter.id} id={meter.id} onClick={() =>this.handleBuildingChange(meter.id)}>{meter.name}</li>
//     // );
// }

}
handleTimeChange(type){

      this.setState({currentGraph:type});
      this.filterDataforGraph(this.props,type);

}
handleBuildingChange(id){

  let selectedMeters = [];
  selectedMeters.push(parseInt(id));
  this.props.selectMeters(selectedMeters,"all");
  // if（this.state.buildingOn!=null）{
  //   document.getElementById(this.state.buildingOn).className="";
  //   document.getElementById("b"+this.state.buildingOn).id="b"+id;
  // }else{
  //   document.getElementById("b-1").id="b"+id;
  // }
  // alert(this.state.buildingOn);
  if(this.state.buildingOn!=id){
  this.setState({currentGraph:"week"});
  document.getElementById(this.state.buildingOn).className="";
  this.setState({buildingOn: id});
  document.getElementById(id).className="on";
  if(document.getElementById("pastBuilding")!=null){
    document.getElementById("pastBuilding").id="nextBuilding";
  }
  if(this.state.id1!=this.state.buildingOn){
    this.setState({id1: id});
  }else{
    this.setState({id2: id});
  }
  document.getElementById("currentBuilding").id="pastBuilding";
  document.getElementById("nextBuilding").id="currentBuilding";

  }

}

 	render() {
    let navList = this.props.meters.map(meter =>
      <li className="navLi " key={meter.id} id={meter.id} onClick={() =>this.handleBuildingChange(meter.id)}>{meter.name}{meter.id}</li>
    );
    // if(this.state.switchBuilding=="true"){
    //   let newCurrent = <div id="currentBuilding"><CompetitionBuilding id="2" meters={this.props.meters} dispatch={this.props.fetchMetersDataIfNeeded}/></div>;
    // }

 	// 	const labelStyle = {
 	// 		textDecoration: 'underline'
 	// 	};
 	// 	const divPadding = {
 	// 		paddingTop: '35px'
 	// 	};
 		return (
      <div className="competitionCon">
        <div className="competitionCenter" id="competitionCenter">
          <div id="currentBuilding"><CompetitionBuilding handleTimeChange={this.handleTimeChange.bind(this)} data={this.state.data}thisMeter={this.state.id1} id="b1" meters={this.props.meters} type={this.state.currentGraph}fetchMetersDataIfNeeded={this.props.fetchMetersDataIfNeeded}/></div>
          <div id="nextBuilding"><CompetitionBuilding handleTimeChange={this.handleTimeChange.bind(this)} data={this.state.data}thisMeter={this.state.id2} id="b2" meters={this.props.meters} type={this.state.currentGraph}fetchMetersDataIfNeeded={this.props.fetchMetersDataIfNeeded} fetchNewReadings={this.props.fetchNewReadings}/></div>

        </div>
        <div className="nav">
          <ul>
            {navList}
          </ul>
        </div>
      </div>
    );
 	}
 }
