import React from 'react';
// import CellComponent from './CellComponent';
// import AppliancesGridComponent from './AppliancesGridComponent';

export default class CellComponent extends React.Component {



	render(){
		// const tableStyle = {
		// 	width: '80%',
    //   height:'100%'
		// };
		  let roundedCost = "";
      let value =this.props.unitEnergy*this.props.peoplePerBuilding*this.props.constant;
			let cost =value*0.08;
			if(cost<1){
				roundedCost = Math.round(cost*100)+"¢";
			}
			else{
				roundedCost= "$"+ Math.round(cost);
				roundedCost=roundedCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}
				let roundedValue= Math.round(value*10)/10;
		// let appliances;
		// if(this.state.virtualAppliances){
		// 	appliances = this.state.virtualAppliances.map(appliance=>{
		// 		//please check this key value(might have problem)
		// 			return (
		// 				<ApplianceComponent key= {appliance.applianceId} appliance = {appliance} status={appliance.status} handler={this.props.handler}/>
		// 			);
    //
    //
		// 	});
		// }
		return(

      <td>
				{roundedValue} kWh<br/>
				{roundedCost}
			</td>
		);
	}
}
