/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

export default class MeterDropDownComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	handleMeterSelect(e) {
		this.props.updateSelectedMeter(e.target.value);
	}

	render() {
		return (
			<select onChange={this.handleMeterSelect}>
				{this.props.meters.map(meter =>
					<option key={meter.id} value={meter.id}>{meter.name}</option>
				)}
			</select>
		);
	}
}
