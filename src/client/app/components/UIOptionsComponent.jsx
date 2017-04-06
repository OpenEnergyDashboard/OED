/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

export default class UIOptionsComponent extends React.Component {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.state = {
			barDuration: 30
		};
	}

	/**
	 * Called when this component mounts
	 * Dispatches a Redux action to fetch meter information
	 */
	componentWillMount() {
		this.props.fetchMetersDataIfNeeded();
	}

	handleMeterSelect(e) {
		e.preventDefault();
		const options = e.target.options;
		const selectedMeters = [];
		// We can't map here because this is a collection of DOM elements, not an array.
		for (let i = 0; i < options.length; i++) {
			if (options[i].selected) {
				selectedMeters.push(parseInt(options[i].value));
			}
		}
		this.props.selectMeters(selectedMeters);
	}

	handleBarDurationChange(value) {
		this.setState({ barDuration: value });
	}

	handleBarDurationChangeComplete(e) {
		e.preventDefault();
		// TODO Dispatch redux action to fetch new bar chart data if needed
	}

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
	render() {
		const labelStyle = {
			textDecoration: 'underline'
		};
		const divPadding = {
			paddingTop: '35px'
		};
		return (
			<div className="col-xs-2" style={divPadding}>
				<div className="col-xs-11">
					<div>
						<div className="form-group">
							<p style={labelStyle}>Select meters:</p>
							<select multiple className="form-control" id="meterList" size="8" onChange={this.handleMeterSelect}>
								{this.props.meters.map(meter =>
									<option key={meter.id} value={meter.id}>{meter.name}</option>
								)}
							</select>
						</div>
					</div>
					<p style={labelStyle}>Graph Type:</p>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Line" defaultChecked />Line</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Bar" />Bar</label>
					</div>
					<div className="radio">
						<label><input type="radio" name="graphTypes" value="Map" />Map</label>
					</div>
					<p style={labelStyle}>Bar chart interval (days):</p>
					<Slider min={1} max={365} value={this.state.barDuration} onChange={this.handleBarDurationChange} onChangeComplete={this.handleBarDurationChangeComplete} />
				</div>
			</div>
		);
	}
}
