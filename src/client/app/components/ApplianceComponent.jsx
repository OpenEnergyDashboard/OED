import React from 'react';

// import ApplianceComponent from './ApplianceComponent';
// import AppliancesGridComponent from './AppliancesGridComponent';

export default class ApplianceComponent extends React.Component {

	constructor(props) {
		super(props);
    this.state={
      info1:'block',
			info2:'none'
			//current additional energy usage
			// virtualAppliancesOn:0

    }

	};
	mouseEnterHandler(){
		this.setState({info1: 'none'});
		this.setState({info2: 'block'});
	}
	mouseLeaveHandler(){
		this.setState({info1: 'block'});
		this.setState({info2: 'none'});
	}


	render(){
		let applianceClass='appliance';
		if(this.props.appliance.status=="on"){
			applianceClass='appliance on';
		}
		else{
			applianceClass='appliance';
		}

		return (
      <li className={applianceClass} onClick={()=>{this.props.handler(this.props.appliance.applianceId-1,this.props.appliance.energyUsage);}}>
			 <div className="info1">
				 {this.props.appliance.name}<br/>
				 {this.props.appliance.energyUsage*1000} W<br/>
				 {this.props.appliance.number} is on<br/>
			 </div>
			 <div className="info2">
				 {this.props.appliance.hoursPerTime} hours per time<br/>
				 {this.props.appliance.timesPerDW} times {this.props.appliance.dw}<br/>
				 Shared: {this.props.appliance.shared}<br/>
			 </div>
      </li>
		);
	}
}
