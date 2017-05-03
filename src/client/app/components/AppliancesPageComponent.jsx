import React from 'react';
import ApplianceComponent from './ApplianceComponent';
import AppliancesGridComponent from './AppliancesGridComponent';
import AppliancesOptionsComponent from './AppliancesOptionsComponent';
import ApplianceAddComponent from './ApplianceAddComponent';

/**
 * Component for appliance page
 */
export default class AppliancesPageComponent extends React.Component {

	constructor(props) {
		super(props);
    this.state={
      virtualAppliances:[],
      currentEnergy:0,
      // hoursPerTime:0,
      // timesPerDay:0,
      peoplePerBuilding:0,
			displayOption: 'none',
			clicked:'0',
			topValue:0,
			totalAppliances:0,
			scrollClick:0,
			displayAdd:'none'

    }
	 };
	 /**
 	 * click on one appliance -
	 * option popup if not on, if the appliance is already on, clicking turns it off
 	 * @param id the id of the clicked appliance
	 * @usage unit usage of the clicked appliance.
 	 */
	applianceClickHandler(id,usage){
	  //change the status of click appliance to either on or off + keep track of added energyusage.
		const VACopy = this.state.virtualAppliances.slice();
		 if(this.state.virtualAppliances[id].status==="off"){
			this.setState({displayOption:'block'});
			this.setState({clicked:id});
		 }
		 else{
			VACopy[id].status="off";
			this.state.currentEnergy = this.state.currentEnergy-VACopy[id].nowUsing;
			VACopy[id].nowUsing=0;
			VACopy[id].number=0;
			VACopy[id].hoursPerTime=0;
			VACopy[id].dw='daily';
			VACopy[id].shared='No';
			VACopy[id].timesPerDW=0;


		 }
		 this.setState({virtualAppliances: VACopy});

	 }
	 /**
		* opens up popup for adding new appliance
		*/
	 handleAdd(){
		 this.setState({displayAdd:'block'});

	 }
	 /**
	  * close popup
	  */
	 closeHandler(){
		 this.setState({displayOption:'none'});
		 this.setState({displayAdd:'none'});

 	 }
	 /**
	  * save option inputs + close popup
	  */
	 saveOptionsHandler(number,hoursPerTime,dw,timesPerDW,shared){
		 let id=this.state.clicked;
		 let sharedFraction = 1;
		 let dailyTimes=timesPerDW;
		 const VACopy = this.state.virtualAppliances.slice();
		  let thisUnit = VACopy[id].energyUsage;
		 	VACopy[id].status="on";
			VACopy[id].number=number;
			VACopy[id].hoursPerTime=hoursPerTime;
			VACopy[id].dw=dw;
			VACopy[id].shared=shared;
			VACopy[id].timesPerDW=timesPerDW;
		if(shared=='Yes'){
			//shared assumes sharing between two people
			sharedFraction = 0.5;
		}
		if(dw=='weekly'){
			dailyTimes=dailyTimes/7;
		}
		let thisUsage= number*thisUnit*hoursPerTime*dailyTimes*sharedFraction;
		let newEnergy= this.state.currentEnergy+thisUsage;
		VACopy[id].nowUsing=thisUsage;
		this.setState({virtualAppliances: VACopy});
		this.setState({displayOption:'none'});
		this.setState({currentEnergy:newEnergy});
		//end here
		}
		/**
		 * save inputs to add new appliance
		 */
		saveAddHandler(name,usage){
 		 let newId=this.state.virtualAppliances.length+1;
		 const VACopy = this.state.virtualAppliances.slice();
		 VACopy.push({
			 applianceId:newId,
			 name: name,
			 energyUsage: usage,
			 timesPerDW:0,
			 hoursPerTime:0,
			 dw:'daily',
			 shared:'No',
			 status:"off",
			 number:'0',
			 nowUsing:'0'
		 });
		 this.setState({virtualAppliances: VACopy});
		 this.setState({displayAdd:'none'});
 		}

		/**
		 * click to scroll appliance list
		 */
		handlePrev(){
			if(this.state.scrollClick>0){
				let list = document.getElementById("appliancesList");
				let newTop= this.state.topValue+110;
				this.setState({topValue:newTop});
				let newScrollClick=this.state.scrollClick-1;
				this.setState({scrollClick:newScrollClick});
			}
		}
		/**
		 * click to scroll appliance list
		 */
		handleNext(){
			if(this.state.scrollClick<this.state.virtualAppliances.length-3){
				let list = document.getElementById("appliancesList");
				let newTop= this.state.topValue-110;
				this.setState({topValue:newTop});
				let newScrollClick=this.state.scrollClick+1;
				this.setState({scrollClick:newScrollClick});
			}
		}



	//set appliance data.
	componentWillMount(){
		this.setState({virtualAppliances:[
      {
				applianceId:1,
        name: "100W light bulb",
				energyUsage: 0.1,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:2,
        name: "Coffee Maker",
				energyUsage: 0.9,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:3,
        name: "Desktop Computer",
				energyUsage: 0.25,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'

      },
			{
				applianceId:4,
        name: "Electric Kettle",
				energyUsage:1.5,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:5,
        name: "Food Blender",
				energyUsage: 0.3,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:6,
        name: "Fridge",
				energyUsage: 0.2,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:7,
        name: "Hair Dryer",
				energyUsage: 1.8,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:8,
        name: "Internet Router",
				energyUsage: 0.005,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:9,
        name: "Microwave",
				energyUsage: 0.8,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:10,
        name: "Phone/Tablet Charger",
				energyUsage: 0.005,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:11,
        name: "TV(19''color)",
				energyUsage: 0.06,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      },
			{
				applianceId:12,
        name: "Vacuum Cleaner",
				energyUsage: 0.4,
				timesPerDW:0,
				hoursPerTime:0,
				dw:'daily',
				shared:'No',
				status:"off",
				number:'0',
				nowUsing:'0'
      }

    ]});
	}

	render(){

		let appliances;
		let maskClass="mask on";
		if(this.state.displayOption=="block" || this.state.displayAdd=="block"){
			maskClass="mask on";
		}else{
			maskClass="mask";
		}
		if(this.state.virtualAppliances){
			appliances = this.state.virtualAppliances.map(appliance=>{
				//please check this key value(might have problem)
					return (
						<ApplianceComponent key= {appliance.applianceId} appliance = {appliance} status={appliance.status} handler={this.applianceClickHandler.bind(this)}/>
					);


			});
		}
		return(
			<div className="appliancesCon">
	      <div className="container-fluid appliancesWrap">
					<div className="ulWrap">
						<span id="upArrow" onClick={this.handlePrev.bind(this)}> <img src="../app/images/arrow.png" alt="arrow up" width="70px" height="65px"/> </span>
						<div className='appliancesListCon'>
							<ul className="appliancesList" id="appliancesList" style={{transition: 'top 0.5s', top:this.state.topValue}}>
			          {appliances}
								<li className='addNew appliance' onClick={this.handleAdd.bind(this)}>Add New</li>
			        </ul>
						</div>
						<span id="downArrow" onClick={this.handleNext.bind(this)}> <img src="../app/images/arrow.png" alt="arrow down" width="70px" height="65px"/> </span>
					</div>
					<AppliancesOptionsComponent display={this.state.displayOption} clicked={this.state.clicked} appliance = {this.state.virtualAppliances[this.state.clicked]} closeHandler={this.closeHandler.bind(this)} saveHandler={this.saveOptionsHandler.bind(this)}/>
					<ApplianceAddComponent display={this.state.displayAdd} closeHandler={this.closeHandler.bind(this)} saveHandler={this.saveAddHandler.bind(this)}/>
	        <div className="appliancesGrid">
	  			   <AppliancesGridComponent unitEnergy={this.state.currentEnergy}/>
	  		  </div>
	      </div>
				<div className={maskClass}></div>
			</div>

		);
	}
}
