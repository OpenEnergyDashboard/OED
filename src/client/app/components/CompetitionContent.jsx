import React from 'react';
import CompetitionBuilding from './CompetitionBuilding';
import moment from 'moment';
import TimeInterval from '../../../common/TimeInterval';

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
     currentGraph:"week",
     timeInterval:0
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
    let datapacks=[[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]]];
    let color=[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];

    let data=[];
    if(type=="week"||type=="month"){
      //what day is current day
      let currentWeekday = dayThisWeek.day();
    for (const reading of prop.data.datasets[0]['data']) {
      if (moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(startThisWeek)) {
        if(moment(reading['x']).isBefore(dayLastWeek)){
          datapacks[moment(reading['x']).day()][0].push([reading['x'],parseFloat(reading['y'])]);
          color[moment(reading['x']).day()][0]="rgba(55, 160, 225, 0.7)";
        }
        else{
          datapacks[moment(reading['x']).day()+1][0].push([reading['x'],parseFloat(reading['y'])]);
          color[moment(reading['x']).day()+1][0]="rgba(225, 58, 55, 0.7)";
        }
      }else if(moment(reading['x']).isAfter(startThisWeek)&&moment(reading['x']).isBefore(dayThisWeek)){
          datapacks[moment(reading['x']).day()][1].push([reading['x'],parseFloat(reading['y'])]);
          color[moment(reading['x']).day()][1]="rgba(55, 160, 225, 0.7)";
        }
    //  if (moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(startThisWeek)) {
    //    pastWeekTotal+=parseFloat(reading['y']);
    //    if(moment(reading['x']).isBefore(dayLastWeek)){
    //      pastWeekEqul+=parseFloat(reading['y']);
    //      datapacks[moment(reading['x']).day()][0]+=parseFloat(reading['y']);
    //      color[moment(reading['x']).day()][0]="rgba(55, 160, 225, 0.7)";
    //    }
    //    else{
    //      datapacks[moment(reading['x']).day()+1][0]+=parseFloat(reading['y']);
    //      color[moment(reading['x']).day()+1][0]="rgba(225, 58, 55, 0.7)";
    //    }
    //  }else if(moment(reading['x']).isAfter(startThisWeek)&&moment(reading['x']).isBefore(dayThisWeek)){
    //      thisWeekEqul+=parseFloat(reading['y']);
    //      datapacks[moment(reading['x']).day()][1]+=parseFloat(reading['y']);
    //      color[moment(reading['x']).day()][1]="rgba(55, 160, 225, 0.7)";
    //    }

   }
   let newDatapacks=[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
   for(let i=0;i<datapacks.length;i++){
     newDatapacks[i][0]= this.findUsageSum(datapacks[i][0]);
     newDatapacks[i][1]= this.findUsageSum(datapacks[i][1]);
   }
   for(let i=0;i<newDatapacks.length;i++){
     if(i<=currentWeekday){
       pastWeekEqul+=newDatapacks[i][0];
       thisWeekEqul+=newDatapacks[i][1];
     }
     pastWeekTotal+=newDatapacks[i][0];
   }
   let projectedThisWeek = thisWeekEqul/(pastWeekEqul/pastWeekTotal);

  //  alert(pastWeekEqul+","+thisWeekEqul+"..."+datapacks.toSource());
   for(let i=newDatapacks.length-1;i>=0;i--){
     if(newDatapacks[i][1]==0){
       newDatapacks[i][1]=(newDatapacks[i][0]/pastWeekTotal)*projectedThisWeek;
       color[i][1]="rgba(225, 58, 55, 0.5)";
     }
   }

   data = [[pastWeekEqul,thisWeekEqul],[pastWeekTotal,projectedThisWeek],projectedThisWeek-pastWeekTotal,newDatapacks,color,currentWeekday];
    this.setState({data:data});
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



}
findUsageSum(dataPoints){
  let sum=0;
  let last,current,diff;
  if(dataPoints.length>=2){

    for(let i=1;i<dataPoints.length-1;i++){
      current = dataPoints[i][0];
      last = dataPoints[i-1][0];
      diff = moment.duration(moment(current).diff(moment(last))).asHours();
      sum+=(dataPoints[i][1]+dataPoints[i-1][1])*diff/2;
    }
    return sum;
  }
  else if(dataPoints.length==0){
    return 0;
  }
  else{return dataPoints[0][1];}
}

componentWillMount(){
  let currentTime=moment().valueOf();
  let startingPoint=moment().subtract(31,"days").valueOf();
  let timeInterval =new TimeInterval(startingPoint,currentTime);
  this.setState({timeInterval:timeInterval});
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
      <li className="navLi " key={meter.id} id={meter.id} onClick={() =>this.handleBuildingChange(meter.id)}>{meter.name}</li>
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
