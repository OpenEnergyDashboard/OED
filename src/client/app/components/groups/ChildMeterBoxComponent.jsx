/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Box classes for displaying child meters and groups
import React from 'react';

export default class ChildMeterBox extends React.Component {

	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
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

	render() {
		const boxStyle = {
			display: 'inline-block',
			width: '200px',
			alignSelf: 'left',
			marginLeft: '10%',
			marginRight: '10%'

		};


		const labelStyle = {
			textDecoration: 'underline'
		};
		return (
			<div style={boxStyle}>
				<h3>Child Meters</h3>
				<div className="form-group">
					<p style={labelStyle}>Select meters:</p>
					<select multiple className="form-control" id="meterList" size="8" onChange={this.handleMeterSelect}>
						{this.props.meters.map(meter =>
							<option key={meter.id} value={meter.id}>{meter.name}</option>
						)}
					</select>
				</div>
			</div>
		);
	}
}
