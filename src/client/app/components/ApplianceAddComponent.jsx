import React from 'react';


/**
 * Component for popup dialog for adding a new appliance
 * need to validate input
 */
export default class ApplianceAddComponent extends React.Component {
	/**
	 * Initializes the component's state. by default daily is checked and the device is not shared
	 */
	constructor(props) {
		super(props);
    this.state={
      radioChecked:'daily',
			shared:"No"

    }

	};

	/**
	 * handles saving of options
	 */
	saveHandler(name,usage){
		if(name=="" || usage==""){
			alert('Please fill in all inputs');
		}
		else{
			this.refs.name.value="";
			this.refs.usage.value="";
			this.props.saveHandler(name,usage);
		}
	}
	/**
	 * close option popup
	 */
	closeHandler(){
		this.refs.name.value="";
		this.refs.usage.value="";
		this.props.closeHandler();
	}


	render(){
		let o=0;
		let m=0;
		let addClass='pop add';
		if(this.props.display=='block'){
			addClass='pop add on';
		}else{
			addClass='pop add';
		}


		const buttonStyle = {
			float:'right',
			position:'relative',
			marginLeft:'10px'
		};
		const buttonListStyle = {
			float:'right'
			//need to be fixed for viewport ratio
		};
		const radioStyle = {
			fontWeight:'bold',
			marginRight:'20px'
		};

		return (
			<div>

	      <div className={addClass} ref="appliancesOptions">
					<div className = 'popInner'>
						<div>

							<label>Appliance Name</label><br/>
							<input type="text" ref="name"/>
						</div><br />
		        <div>
		          <label>Hourly Usage(kW)</label><br/>
		          <input type="text" ref="usage"/>
		        </div>

						<div style={buttonListStyle}>
							<button  style={buttonStyle} type="button" id="close" className="btn btn-primary" onClick={this.closeHandler.bind(this)}>Cancel</button>
							<button  style={buttonStyle} type="button" id="submit" className="btn btn-primary" onClick={()=>{this.saveHandler(this.refs.name.value,this.refs.usage.value);}}>Add Appliance</button>
						</div>
					</div>
	      </div>
			</div>
		);
	}
}
