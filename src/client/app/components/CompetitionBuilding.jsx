import React from 'react';
import { Bar,Radar } from 'react-chartjs-2';
import moment from 'moment';
import 'chartjs-plugin-zoom';
export default class CompetitionBuilding extends React.Component {

	constructor(props) {
		super(props);
      this.state={
       meters:[],
       currentDate:"",
       weekday:"",
       id:"",
       compareDate:"",
			 diff:0,
			 options:{},
			 data:[[0,0][0,0],0,0,0,0,0]
      }
	};

	/**
	 * Called when this component mounts
	 * Dispatches a Redux action to fetch meter information
	 */
	 componentWillReceiveProps(nextProps) {
		 this.setState({data:nextProps.data});
		 if(nextProps.thisMeter!=this.props.thisMeter){
			 document.getElementById("week"+this.props.id).className="on";
 	    document.getElementById("month"+this.props.id).className="";
			document.getElementById("day"+this.props.id).className="";
		 }
		 if(nextProps.data.length==6){
			//  alert(parseFloat(nextProps.data[2]));
			this.setState({diff:parseFloat(nextProps.data[2])});
		  this.setState({options:{
				animation: {
						duration: 10
					},
				legend:{
					display:false
				},
				scales:{
					xAxes:[{
						// stacked:true
					}],
					yAxes:[{
						stacked:true
					}]
				},

			}});

		 }
		 else{
		 }
	 // 	for (const meterID of nextProps.notLoadedMeters) {
	 // 		nextProps.fetchNewReadings(meterID, nextProps.startTimestamp, nextProps.endTimestamp);
	 // 	}
	 // 	  this.setState({series:nextProps.series});
	 	}
	componentWillMount() {
		// this.props.fetchMetersDataIfNeeded();
    let currentDate=this.currentDate();
    // this.setState({weekday: "Friday"});
    this.setState({currentDate: currentDate});
    let id = "lgNumber"+this.props.id;
    this.setState({id: id});
    //find date in last week for compareing.
    // this.setState({currentDate: currentDate});
    this.setState({compareDate: "03/17/17"});

	}
	// componentDidMount(){
	// 		this.refs.barChart.type="horizontal";
	// }
  componentDidUpdate(newProps){
    if(newProps.thisMeter!=this.props.thisMeter){
    //numberFlip
    // let span =  document.getElementById(this.state.id);
    // span.innerHTML="0";
		// let number = Math.abs(Math.round(this.state.diff*10)/10);
    // this.numberFlip(span,0,number);
    //numberFlip ends here
    //

    }

  }

  currentDate(){
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();
    let weekday = today.getDay();
    switch (weekday) {
      case 0:
        this.setState({weekday: "Sunday"});
        break;
      case 1:
        this.setState({weekday: "Monday"});
        break;
      case 2:
        this.setState({weekday: "Tuesday"});
        break;
      case 3:
        this.setState({weekday: "Wednesday"});
        break;
      case 4:
        this.setState({weekday: "Thursday"});
        break;
      case 5:
        this.setState({weekday: "Friday"});
        break;
      case 6:
        this.setState({weekday: "Saturday"});
        break;
    }

    if(dd<10) {
        dd='0'+dd
    }

    if(mm<10) {
        mm='0'+mm
    }

    return today = mm+'/'+dd+'/'+yyyy;
  }
	handleTimeChange(type){
		if(this.props.type!=type){
	    document.getElementById(this.props.type+this.props.id).className="";
	    document.getElementById(type+this.props.id).className="on";
			this.props.handleTimeChange(type);
		}
	}
  numberFlip(element,current,limit){
    let self = this;
   setTimeout(function () {
      let inner = element.innerHTML=parse(element.innerHTML);
			inner = Math.round(inner*10)/10;
			element.innerHTML=inner+0.1;
      current+=0.1;
      if (current < limit) {
         self.numberFlip(element,current,limit);
      }
   }, 10)
}
generateLabelArray(current){
	let array = ["","","","","","","",""];
	let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	for(let i = 0; i<array.length; i++){
		if(i<=current){
			array[i]=weekdays[i];
		}
		else{
			array[i]=weekdays[i-1];
		}
	}
	return array;
}

	// handleMeterSelect(e) {
	// 	e.preventDefault();
	// 	const options = e.target.options;
	// 	const selectedMeters = [];
	// 	// We can't map here because this is a collection of DOM elements, not an array.
	// 	for (let i = 0; i < options.length; i++) {
	// 		if (options[i].selected) {
	// 			selectedMeters.push(parseInt(options[i].value));
	// 		}
	// 	}
	// 	this.props.selectMeters(selectedMeters);
	// }

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
	render() {
		let dates = [];
		let barDisplay = "";
		let radarDisplay = "";
		let dataPack1,dataPack2,dataPack3,dataPack4,dataPack5,dataPack6,dataPack7,dataPack8,color1,color2,color3,color4,color5,color6,color7,color8;
		let labels = this.generateLabelArray(this.state.data[5]);

		if(this.state.data[3]!=undefined){
			// alert(this.state.data.toSource());
	  dataPack1 = this.state.data[3][0];
		dataPack2 = this.state.data[3][1];
		dataPack3 =this.state.data[3][2];
		dataPack4 =this.state.data[3][3];
		dataPack5 =this.state.data[3][4];
		dataPack6 =this.state.data[3][5];
		dataPack7 =this.state.data[3][6];
		dataPack8 =this.state.data[3][7];
		color1=this.state.data[4][0];
		color2=this.state.data[4][1];
		color3=this.state.data[4][2];
		color4=this.state.data[4][3];
		color5=this.state.data[4][4];
		color6=this.state.data[4][5];
		color7=this.state.data[4][6];
		color8=this.state.data[4][7];

	}

		switch (this.props.type) {
			case "week":
				dates = ["Past Week","This Week"];
				barDisplay = "block";
				radarDisplay = "none";
				break;
			case "month":
				dates = ["Past Month","This Month"];
				barDisplay = "block";
				radarDisplay = "none";
				break;
			case "day":
				dates = ["1","2","3","4","5","6","7","8","9","10","11","12"];
				barDisplay = "none";
				radarDisplay = "block";
				// dataPack1 = this.props.data[1];
				// dataPack2 = [];
				break;
		}

		let data1 = {
        labels: dates,
        datasets: [
        {
            label: labels[0],
	          data: dataPack1,
						backgroundColor: color1,
						hoverBackgroundColor: color1,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
        },
        {
            label: labels[1],
            data: dataPack2,
						backgroundColor: color2,
						hoverBackgroundColor: color2,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
         },
				{
						label: labels[2],
						data: dataPack3,
						backgroundColor: color3,
						hoverBackgroundColor: color3,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				},
				{
						label: labels[3],
						data: dataPack4,
						backgroundColor: color4,
						hoverBackgroundColor: color4,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				},
				{
						label: labels[4],
						data: dataPack5,
						backgroundColor: color5,
						hoverBackgroundColor: color5,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				},
				{
						label: labels[5],
						data: dataPack6,
						backgroundColor: color6,
						hoverBackgroundColor: color6,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				},
				{
						label: labels[6],
						data: dataPack7,
						backgroundColor: color7,
						hoverBackgroundColor: color7,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				},
				{
						label: labels[7],
						data: dataPack8,
						backgroundColor: color8,
						hoverBackgroundColor: color8,
						borderWidth: 2,
						borderColor:"rgba(225, 225, 225, 1)",
						hoverBorderColor: 'lightgrey'
				}

        ]
    };

		return (
      <div className="competitionBuildingCon">
        <div className="banner">
          <span className="sm"></span><span className="lgNumber"id={this.state.id}>{Math.round(this.state.diff*100)/100}</span><span id="unit">kWh</span>
          <div className="dateTime"><span className="date">{this.state.weekday}<br/>{this.state.currentDate}</span></div>
        </div>
        <div className="info" >
					<div className="buildingBar" style={{display:barDisplay}}>
						<Bar  ref="barChart" data={data1} options={this.state.options}/>
					</div>
					<div className="buildingRadar" style={{display:radarDisplay}}>
						<Radar ref="RadarChart" data={data1} options={this.state.options}/>
					</div>
        </div>
				<div className=" buildingSide">
					<ul>
						<li id={"week"+this.props.id}onClick={() => this.handleTimeChange("week")} className="on">Week</li>
						<li id={"month"+this.props.id} onClick={() => this.handleTimeChange("month")} >4 Weeks</li>
						<li id={"day"+this.props.id} onClick={() => this.handleTimeChange("day")}>Day</li>
					</ul>
				</div>
				<div className="buildingStats">
					Past Total:<br/>{Math.round(this.state.data[1][0]*100)/100} KWH<br/><br/>
					Current Usage: <br/>{Math.round(this.state.data[0][1]*100)/100} KWH
				</div>

			</div>
		);
	}
}
