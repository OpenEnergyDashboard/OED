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
		this.state = {
			radioChecked: 'daily',
			shared: 'No'

		};
		this.closeHandler = this.closeHandler.bind(this);
	}

	/**
	 * handles saving of options
	 */
	saveHandler(name, usage) {
		if (name === '' || usage === '') {
			alert('Please fill in all inputs');
		} else {
			document.getElementById('newName').value = '';
			document.getElementById('newUsage').value = '';
			this.props.saveHandler(name, usage);
		}
	}
	/**
	 * close option popup
	 */
	closeHandler() {
		document.getElementById('newName').value = '';
		document.getElementById('newUsage').value = '';
		this.props.closeHandler();
	}


	render() {
		let addClass = 'pop add';
		if (this.props.display === 'block') {
			addClass = 'pop add on';
		} else {
			addClass = 'pop add';
		}


		const buttonStyle = {
			float: 'right',
			position: 'relative',
			marginLeft: '10px'
		};
		const buttonListStyle = {
			float: 'right'
			// need to be fixed for viewport ratio
		};

		return (
			<div>

				<div className={addClass}>
					<div className="popInner">
						<form>
							<div>
								<label>Appliance Name</label><br />
								<input type="text" id="newName" />
							</div><br />
							<div>
								<label>Hourly Usage(kW)</label><br />
								<input type="text" id="newUsage" />
							</div>
							<div style={buttonListStyle}>
								<button style={buttonStyle} type="button" id="close" className="btn btn-primary" onClick={this.closeHandler}>Cancel</button>
								<button style={buttonStyle} type="button" id="submit" className="btn btn-primary" onClick={() => { this.saveHandler(document.getElementById('newName').value, document.getElementById('newUsage').value); }}>Add Appliance</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}
}
