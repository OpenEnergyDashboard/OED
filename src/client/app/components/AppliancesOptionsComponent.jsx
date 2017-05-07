import React from 'react';

/**
 * component for the option popup when turning on an appliance
 */
export default class AppliancesOptionsComponent extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			radioChecked: 'daily',
			shared: 'No'

		};
		this.radioHandler = this.radioHandler.bind(this);
		this.sharedHandler = this.sharedHandler.bind(this);
		this.closeHandler = this.closeHandler.bind(this);
	}
	/**
	 * handles checking daily/weely radio
	 */
	radioHandler() {
		if (document.getElementById('daily').checked === true) {
			this.setState({ radioChecked: 'daily' });
		} else {
			this.setState({ radioChecked: 'weekly' });
		}
	}
	/**
	 * handles checking shared checkbox
	 */
	sharedHandler() {
		if (this.state.shared === 'No') {
			this.setState({ shared: 'Yes' });
		}		else {
			this.setState({ shared: 'No' });
		}
	}
	/**
	 * saving options
	 */
	saveHandler(number, hoursPerTime, minutesPerTime, dw, timesPerDW, shared) {
		if (number === '' || timesPerDW === '' || (hoursPerTime === '' && minutesPerTime === '')) {
			alert('Please fill in all inputs');
		}		else {
			let newHoursPerTime = hoursPerTime;
			if (minutesPerTime !== '') {
				newHoursPerTime = minutesPerTime / 60;
				newHoursPerTime = Math.round(newHoursPerTime * 100) / 100;
				if (hoursPerTime !== '') {
					newHoursPerTime += parseInt(hoursPerTime);
				}
			}
			document.getElementById('numberOfAppliances').value = '';
			document.getElementById('hoursPerTime').value = '';
			document.getElementById('timesPerDW').value = '';
			document.getElementById('minutesPerTime').value = '';
			document.getElementById('daily').checked = true;
			this.setState({ shared: 'No' });
			this.setState({ radioChecked: 'daily' });
			document.getElementById('shared').checked = false;
			this.props.saveHandler(number, newHoursPerTime, dw, timesPerDW, shared);
		}
	}
	closeHandler() {
		document.getElementById('numberOfAppliances').value = '';
		document.getElementById('hoursPerTime').value = '';
		document.getElementById('timesPerDW').value = '';
		document.getElementById('minutesPerTime').value = '';
		document.getElementById('daily').checked = true;
		document.getElementById('shared').checked = false;
		this.setState({ shared: 'No' });
		this.setState({ radioChecked: 'daily' });
		this.props.closeHandler();
	}


	render() {
		let optionsClass = 'pop option';
		if (this.props.display === 'block') {
			optionsClass = 'pop option on';
		} else {
			optionsClass = 'pop option';
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
		const radioStyle = {
			fontWeight: 'bold',
			marginRight: '20px'
		};
		const inlineRight = {
			left: '40%',
			position: 'absolute'
		};
		const inlineLeft = {
		};

		return (
			<div>

				<div className={optionsClass} id="appliancesOptions">
					<div className="popInner">
						<form>
							<div>
								<label>How many of this appliance</label><br />
								<input type="text" id="numberOfAppliances" />
							</div><br />
							<div>
								<label style={inlineLeft}>Hours per use</label><label style={inlineRight}>Minutes per use</label><br />
								<input style={inlineLeft} type="text" id="hoursPerTime" /><input style={inlineRight} type="text" id="minutesPerTime" />
							</div>
							<br />
							<div>
								<div className="radio">
									<label style={radioStyle}><input type="radio" id="daily" name="times" value="perDay" defaultChecked onChange={this.radioHandler} />Uses Per Day</label>
									<label style={radioStyle}><input type="radio" id="weekly" name="times" value="perWeek" onChange={this.radioHandler} />Uses Per Week</label>
								</div>
								<input type="text" id="timesPerDW" />
							</div>
							<br />
							<div className="checkbox">
								<label><input type="checkbox" id="shared" value="shared" onChange={this.sharedHandler} />Shared Device</label>
							</div>
							<div style={buttonListStyle}>
								<button style={buttonStyle} type="button" id="close" className="btn btn-primary" onClick={this.closeHandler}>Cancel</button>
								<button style={buttonStyle} type="button" id="submit" className="btn btn-primary" onClick={() => { this.saveHandler(document.getElementById('numberOfAppliances').value, document.getElementById('hoursPerTime').value, document.getElementById('minutesPerTime').value, this.state.radioChecked, document.getElementById('timesPerDW').value, this.state.shared); }}>Save Options</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}
}
