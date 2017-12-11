/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { chartTypes } from '../reducers/graph';

/**
 * A component that allows users to select which chart should be displayed.
 */
export default class ChartSelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleChangeChartType = this.handleChangeChartType.bind(this);
	}

	handleChangeChartType(value) {
		this.props.changeChartType(value);
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
			<div style={divBottomPadding}>
				<p style={labelStyle}><FormattedMessage
					id="graph.type"
					defaultMessage="Graph Type:"
				/></p>
				<ToggleButtonGroup
					type="radio"
					name="chartTypes"
					value={this.props.selectedChart}
					onChange={this.handleChangeChartType}
				>
					<ToggleButton value={chartTypes.line}><FormattedMessage
						id="line"
						defaultMessage="Line"
					/></ToggleButton>
					<ToggleButton value={chartTypes.bar}><FormattedMessage
						id="bar"
						defaultMessage="Bar"
					/></ToggleButton>
					<ToggleButton value={chartTypes.compare}><FormattedMessage
						id="compare"
						defaultMessage="Compare"
					/></ToggleButton>
				</ToggleButtonGroup>
			</div>
		);
	}
}
