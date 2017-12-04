/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import MultiSelectComponent from './MultiSelectComponent';

/**
 * A component which allows the user to select which data should be displayed on the chart.
 */
export default class ChartDataSelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleMeterSelect = this.handleMeterSelect.bind(this);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
	}

	/**
 	 * Called when this component mounts
 	 * Dispatches a Redux action to fetch meter information
 	 */
	componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
		this.props.fetchGroupsDetailsIfNeeded();
	}

	/**
	 * Handles a change in meter selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleMeterSelect(selection) {
		this.props.selectMeters(selection.map(s => s.value));
	}

	/**
	 * Handles a change in group selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	handleGroupSelect(selection) {
		this.props.selectGroups(selection.map(s => s.value));
	}

	render() {
		const divBottomPadding = {
			paddingBottom: '15px'
		};

		const labelStyle = {
			fontWeight: 'bold',
			margin: 0
		};

		return (
			<div>
				<FormattedMessage
					id="groups"
					defaultMessage="Groups:"
				/>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.groups}
						selectedOptions={this.props.selectedGroups}
						placeholder="Select Groups"
						onValuesChange={s => this.handleGroupSelect(s)}
					/>
				</div>
				<p style={labelStyle}>Meters:</p>
				<div style={divBottomPadding}>
					<MultiSelectComponent
						options={this.props.meters}
						selectedOptions={this.props.selectedMeters}
						placeholder="Select Meters"
						onValuesChange={s => this.handleMeterSelect(s)}
					/>
				</div>
			</div>
		);
	}
}
