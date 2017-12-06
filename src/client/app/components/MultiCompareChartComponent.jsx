/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import CompareChartContainer from '../containers/CompareChartContainer';

export default function MultiCompareChartComponent(props) {
	let size = 0;
	if (props.selectedMeters.length + props.selectedGroups.length < 3) {
		size = 1;
	}

	const centeredStyle = {
		marginTop: '20%',
		textAlign: 'center'
	};

	const flexContainerStyle = {
		display: 'flex',
		flexFlow: 'row wrap',
	};

	const flexChildStyle = {
		width: '30%',
		flexGrow: size
	};

	// Display a message if no meters are selected
	if (props.selectedMeters.length + props.selectedGroups.length === 0) {
		return (
			<div className="row">
				<div className="col-xs-12" style={centeredStyle}>
					Select one or more items to compare usage over time.
				</div>
			</div>
		);
	}

	return (
		<div style={flexContainerStyle}>
			{props.selectedMeters.map(meterID =>
				<div style={flexChildStyle} key={meterID}>
					<CompareChartContainer key={meterID} id={meterID} isGroup={false} />
				</div>
			)}
			{props.selectedGroups.map(groupID =>
				<div style={flexChildStyle} key={groupID}>
					<CompareChartContainer key={groupID} id={groupID} isGroup />
				</div>
			)}
		</div>
	);
}
