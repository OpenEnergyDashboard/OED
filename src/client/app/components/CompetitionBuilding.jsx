import React from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import 'chartjs-plugin-zoom';

/**
 * component for displaying graph for individual buildings.
 */
export default class CompetitionBuilding extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			meters: [],
			currentDate: '',
			weekday: '',
			// id of this building/meter
			id: '',
			// current graph type week/month/day
			currentGraph: 'week',
			// projected difference between this week/month/day and past
			diff: 0,
			// options for graph
			options: {},
			// data for graph use
			data: [[0, 0], [0, 0], 0, 0, 0, 0, 0]
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ data: nextProps.data });
		if (nextProps.thisMeter !== this.props.thisMeter) {
			document.getElementById('weekb1').className = 'on';
			document.getElementById('monthb1').className = '';
			document.getElementById('dayb1').className = '';
			document.getElementById('weekb2').className = 'on';
			document.getElementById('monthb2').className = '';
			document.getElementById('dayb2').className = '';
		}
		if (nextProps.data.length === 7) {
			// set options
			this.setState({ diff: parseFloat(nextProps.data[2]) });
			this.setState({ options: {
				animationSteps: 20,
				animationEasing: 'easeInOutQuad',
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
					// stacked:true
					}],
					yAxes: [{
						stacked: true
					}]
				},

			} });
		}
	}

	/**
	 * sets some states
	 */
	componentWillMount() {
		const currentDate = this.currentDate();
		this.setState({ currentDate: currentDate });
		const id = `lgNumber${this.props.id}`;
		this.setState({ id: id });
	}
	/**
	 * this is not used
	 */
	componentDidUpdate(newProps) {
		if (newProps.thisMeter !== this.props.thisMeter) {
    // numberFlip
    // let span =  document.getElementById(this.state.id);
    // span.innerHTML="0";
		// let number = Math.abs(Math.round(this.state.diff*10)/10);
    // this.numberFlip(span,0,number);
    // numberFlip ends here
    //

		}
	}
	/**
	 * find current date and weekday to display -could use momentjs
	 */
	currentDate() {
		const today = new Date();
		let dd = today.getDate();
		let mm = today.getMonth() + 1; // January is 0!
		const yyyy = today.getFullYear();
		const weekday = today.getDay();
		switch (weekday) {
			case 0:
				this.setState({ weekday: 'Sunday' });
				break;
			case 1:
				this.setState({ weekday: 'Monday' });
				break;
			case 2:
				this.setState({ weekday: 'Tuesday' });
				break;
			case 3:
				this.setState({ weekday: 'Wednesday' });
				break;
			case 4:
				this.setState({ weekday: 'Thursday' });
				break;
			case 5:
				this.setState({ weekday: 'Friday' });
				break;
			case 6:
				this.setState({ weekday: 'Saturday' });
				break;
			default:
				this.setState({ weekday: 'Sunday' });
				break;
		}
		if (dd < 10) {
			dd = `0${dd}`;
		}
		if (mm < 10) {
			mm = `0${mm}`;
		}
		return `${mm}/${dd}/${yyyy}`;
	}

	/**
	 * changing graph type.
	 *@type the type clicked
	 */
	handleTimeChange(type) {
		if (this.props.type !== type) {
			// style change
			document.getElementById(this.props.type + this.props.id).className = '';
			document.getElementById(type + this.props.id).className = 'on';
			this.props.handleTimeChange(type);
		}
	}
	/**
	 * this is not used
	 */
	// numberFlip(element, current, limit) {
	// 	const self = this;
	// 	setTimeout(() => {
	// 		let inner = element.innerHTML = parse(element.innerHTML);
	// 		inner = Math.round(inner * 10) / 10;
	// 		element.innerHTML = inner + 0.1;
	// 		current += 0.1;
	// 		if (current < limit) {
	// 			self.numberFlip(element, current, limit);
	// 		}
	// 	}, 10);
	// }
	/**
	 * set the labels for week graph
	 *@current current weekday in number 0-7 (0 is sunday)
	 */
	generateLabelArray(current) {
		const array = ['', '', '', '', '', '', '', ''];
		const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		for (let i = 0; i < array.length; i++) {
			if (i <= current) {
				array[i] = weekdays[i];
			}			else {
				array[i] = weekdays[i - 1];
			}
		}
		return array;
	}

	render() {
		let dates = [];
		let barDisplay = '';
		let radarDisplay = '';
		// let dataPack1,dataPack2,dataPack3,dataPack4,dataPack5,dataPack6,dataPack7,dataPack8,color1,color2,color3,color4,color5,color6,color7,color8;
		const labels = this.generateLabelArray(this.state.data[5]);
		//
		// if(this.state.data[3]!=undefined){
		// 	// alert(this.state.data.toSource());
		//
		// }

		switch (this.props.type) {
			case 'week':
				dates = ['Past Week', 'This Week'];
				barDisplay = 'block';
				radarDisplay = 'none';
				break;
			case 'month':
				dates = ['Past Month', 'This Month'];
				barDisplay = 'block';
				radarDisplay = 'none';
				break;
			case 'day':
				dates = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
				barDisplay = 'none';
				radarDisplay = 'block';
				// dataPack1 = this.props.data[1];
				// dataPack2 = [];
				break;
			default:
				dates = ['Past Week', 'This Week'];
				barDisplay = 'block';
				radarDisplay = 'none';
				break;
		}
		// data for week graph
		const weekData = {
			labels: dates,
			datasets: [
				{
					label: labels[0],
					data: this.state.data[3][0],
					backgroundColor: this.state.data[4][0],
					hoverBackgroundColor: this.state.data[4][0],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[1],
					data: this.state.data[3][1],
					backgroundColor: this.state.data[4][1],
					hoverBackgroundColor: this.state.data[4][1],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[2],
					data: this.state.data[3][2],
					backgroundColor: this.state.data[4][2],
					hoverBackgroundColor: this.state.data[4][2],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[3],
					data: this.state.data[3][3],
					backgroundColor: this.state.data[4][3],
					hoverBackgroundColor: this.state.data[4][3],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[4],
					data: this.state.data[3][4],
					backgroundColor: this.state.data[4][4],
					hoverBackgroundColor: this.state.data[4][4],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[5],
					data: this.state.data[3][5],
					backgroundColor: this.state.data[4][5],
					hoverBackgroundColor: this.state.data[4][5],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[6],
					data: this.state.data[3][6],
					backgroundColor: this.state.data[4][6],
					hoverBackgroundColor: this.state.data[4][6],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: labels[7],
					data: this.state.data[3][7],
					backgroundColor: this.state.data[4][7],
					hoverBackgroundColor: this.state.data[4][7],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				}

			]
		};
		// data for month graph
		const monthData = {
			labels: dates,
			datasets: [
				{
					label: '',
					data: this.state.data[3][0],
					backgroundColor: 'rgba(55, 160, 225, 0.7)',
					hoverBackgroundColor: 'rgba(55, 160, 225, 0.7)',
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				},
				{
					label: '',
					data: this.state.data[3][1],
					backgroundColor: ['rgba(225, 58, 55, 0.7)', 'rgba(225, 58, 55, 0.5)'],
					hoverBackgroundColor: ['rgba(225, 58, 55, 0.7)', 'rgba(225, 58, 55, 0.5)'],
					borderWidth: 2,
					borderColor: 'rgba(225, 225, 225, 1)',
					hoverBorderColor: 'lightgrey'
				}

			]
		};
		let datatype = weekData;
		if (this.props.data[6] === 'month') {
			datatype = monthData;
		}

		return (
			<div className="competitionBuildingCon">
				<div className="banner">
					<span className="sm" /><span className="lgNumber"id={this.state.id}>{Math.round(this.state.diff * 100) / 100}</span><span id="unit">kWh</span>
					<div className="dateTime"><span className="date">{this.state.weekday}<br />{this.state.currentDate}</span></div>
				</div>
				<div className="info" >
					<div className="buildingBar" style={{ display: barDisplay }}>
						<Bar data={datatype} options={this.state.options} />
					</div>
					<div className="buildingRadar" style={{ display: radarDisplay }}>
						<Radar data={datatype} options={this.state.options} />
					</div>
				</div>
				<div className=" buildingSide">
					<button id={`week${this.props.id}`} onClick={() => this.handleTimeChange('week')} className="on">Week</button>
					<button id={`month${this.props.id}`} onClick={() => this.handleTimeChange('month')} >Month</button>
					{/* <button id={`day${this.props.id}`} onClick={() => this.handleTimeChange('day')}>Day</button> */}
				</div>
				<div className="buildingStats">
					Past Total:<br />{Math.round(this.state.data[1][0] * 100) / 100} KWH<br /><br />
					Current Usage: <br />{Math.round(this.state.data[0][1] * 100) / 100} KWH
				</div>

			</div>
		);
	}
}
