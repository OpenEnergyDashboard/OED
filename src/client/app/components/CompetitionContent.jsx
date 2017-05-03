import React from 'react';
import CompetitionBuilding from './CompetitionBuilding';
import moment from 'moment';
import TimeInterval from '../../../common/TimeInterval';


/**
 * ugliest code ever !!
 */
export default class CompetitionComponent extends React.Component {

	constructor(props) {
		super(props);
    this.state={
     //current building id
     current:"1",
     //next building id
     next:"2",
     //building on display
     buildingOn:1,
     id1:1,
     id2:2,
     data:[],
     currentGraph:"week",
     timeInterval:0
    }
	}


  componentWillReceiveProps(nextProps) {
    if(nextProps.data.datasets.length!=0){
      //if dataset has data process data for graph
     this.filterDataforGraph(nextProps,this.state.currentGraph);

    }
  }
  /**
   * process data from dataset for graph
   * @prop either this.prop or nextProps
   * @type type of graph
   * there duplicate code in this part
   */
  filterDataforGraph(prop,type){
    let currentGraph = type;
    let daysToSubstract = 0;
    //find latest time
    let currentTime = prop.data.datasets[0]['data'][prop.data.datasets[0]['data'].length-1]['x'];
    // time points needed
    const startThisWeek = moment(currentTime).startOf(currentGraph);
    const startLastWeek = moment(currentTime).startOf(currentGraph).subtract(1,type);
    const dayThisWeek =moment(currentTime);
    const dayLastWeek =moment(currentTime).subtract(1,type);
    let pastWeekTotal=0;
    let pastWeekEqul=0;
    let thisWeekEqul=0;
    //for week data
    let datapacks=[[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]],[[],[]]];
    //for month data
    let datapacks2=[[[],[]],[[],[]]];
    //for week color
    let color=[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
    let data=[];
    //if week graph
    if(type=="week"){
      //what day is current day
      let currentWeekday = dayThisWeek.day();
      //adding data do corresponding array
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


     }
     let newDatapacks=[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
     //find sum for each stack
     for(let i=0;i<datapacks.length;i++){
       newDatapacks[i][0]= this.findUsageSum(datapacks[i][0]);
       newDatapacks[i][1]= this.findUsageSum(datapacks[i][1]);
     }
     //find total for each week
     for(let i=0;i<newDatapacks.length;i++){
       if(i<=currentWeekday){
         pastWeekEqul+=newDatapacks[i][0];
         thisWeekEqul+=newDatapacks[i][1];
       }
       pastWeekTotal+=newDatapacks[i][0];
     }
     let projectedThisWeek = thisWeekEqul/(pastWeekEqul/pastWeekTotal);

     //fill in projected data and color for each future day this week
     for(let i=newDatapacks.length-1;i>=0;i--){
       if(newDatapacks[i][1]==0){
         newDatapacks[i][1]=(newDatapacks[i][0]/pastWeekTotal)*projectedThisWeek;
         color[i][1]="rgba(225, 58, 55, 0.5)";
       }
     }
     data = [[pastWeekEqul,thisWeekEqul],[pastWeekTotal,projectedThisWeek],projectedThisWeek-pastWeekTotal,newDatapacks,color,currentWeekday,"week"];
      this.setState({data:data});
   }
   //for month graph
   if(type=="month"){
     //add data to corresponding array
     for (const reading of prop.data.datasets[0]['data']) {
       if (moment(reading['x']).isAfter(startLastWeek)&&moment(reading['x']).isBefore(startThisWeek)) {
         if(moment(reading['x']).isBefore(dayLastWeek)){
           datapacks2[0][0].push([reading['x'],parseFloat(reading['y'])]);
           color[0][0]="rgba(55, 160, 225, 0.7)";
         }
         else{
           datapacks2[1][0].push([reading['x'],parseFloat(reading['y'])]);
           color[1][0]="rgba(225, 58, 55, 0.7)";
         }
       }else if(moment(reading['x']).isAfter(startThisWeek)&&moment(reading['x']).isBefore(dayThisWeek)){
           datapacks2[0][1].push([reading['x'],parseFloat(reading['y'])]);
           color[moment(reading['x']).day()][1]="rgba(55, 160, 225, 0.7)";
         }

    }
    let newDatapacks=[[0,0],[0,0]];
    for(let i=0;i<datapacks2.length;i++){
      newDatapacks[i][0]= this.findUsageSum(datapacks2[i][0]);
      newDatapacks[i][1]= this.findUsageSum(datapacks2[i][1]);
    }
    pastWeekEqul=newDatapacks[0][0];
    thisWeekEqul=newDatapacks[0][1];
    pastWeekTotal=newDatapacks[0][0]+newDatapacks[1][0];
    let projectedThisWeek=thisWeekEqul/(pastWeekEqul/pastWeekTotal);
    newDatapacks[1][1]=projectedThisWeek-thisWeekEqul;
    data = [[pastWeekEqul,thisWeekEqul],[pastWeekTotal,projectedThisWeek],projectedThisWeek-pastWeekTotal,newDatapacks,color,'0',"month"];
     this.setState({data:data});
   }



  }
  /**
   * calculate approx sum using giving points
   * @dataPoints array of coordinates
   */
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
    else{
      return dataPoints[0][1];
    }
  }

  /**
   * before render get data
   */
  componentWillMount(){
    let currentTime=moment().valueOf();
    let startingPoint=moment().subtract(31,"days").valueOf();
    const timeInterval = new TimeInterval(parseInt(startingPoint), parseInt(currentTime));
    // time interval is not working. ideally get only the most recent 31 days of data.
    this.setState({timeInterval:timeInterval});
    let selectedMeters = [];
    selectedMeters.push(parseInt(1));
    //currently getting all data
    this.props.selectMeters(selectedMeters,"all");
    this.props.fetchMetersDataIfNeeded();
  }
  /**
   * on graph type change, process data again (may have problem)
   * @type type of graph
   */
  handleTimeChange(type){
      this.setState({currentGraph:type});
      this.filterDataforGraph(this.props,type);
  }
  handleBuildingChange(id){
    //get data for this building
    let selectedMeters = [id];
    this.props.selectMeters(selectedMeters,"all");
    //get week data
    this.filterDataforGraph(this.props,"week");
    //if a different building is clicked
    if(this.state.buildingOn!=id){
    //set state to week(always show week first).
    this.setState({currentGraph:"week"});
    // style change for the past building.
    document.getElementById(this.state.buildingOn).className="";
    //set current building.
    this.setState({buildingOn: id});
    //change style for the currently showing building.
    document.getElementById(id).className="on";
    //if there exist a "past building"(not first time clicking), change past building div to be next.
    if(document.getElementById("pastBuilding")!=null){
      document.getElementById("pastBuilding").id="nextBuilding";
    }
    //swap id1 and id2.
    if(this.state.id1!=id){
      this.setState({id1: id});
    }else{
      this.setState({id2: id});
    }
    //set current building to be past and next to be current.
    document.getElementById("currentBuilding").id="pastBuilding";
    document.getElementById("nextBuilding").id="currentBuilding";

    }

  }

	render() {
  let navList = this.props.meters.map(meter =>
    <li className="navLi " key={meter.id} id={meter.id} onClick={() =>this.handleBuildingChange(meter.id)}>{meter.name}{meter.id}</li>
  );
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
