/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import CompareChartContainer from '../containers/CompareChartContainer';

export default function MultiCompareChartComponent(props) {
	// Compute how much space should be used in the bootstrap grid system
	let size;
	if (props.selectedMeters.length === 1) {
		size = 12;
	} else if (props.selectedMeters.length === 2) {
		size = 6;
	} else {
		size = 4;
	}

	const centeredStyle = {
		marginTop: '20%',
		textAlign: 'center'
	};

	// Display a message if no meters are selected
	if (props.selectedMeters.length === 0) {
		return (
			<div className="row">
				<div className="col-xs-12" style={centeredStyle}>
					Select one or more meters to compare usage over time.
				</div>
			</div>
		);
	}


	return (
		<div className="row">
			{props.selectedMeters.map(meterID =>
				<div className={`col-xs-${size}`} key={meterID}>
					<CompareChartContainer key={meterID} id={meterID} />
				</div>
			)}
		</div>
	);
}
