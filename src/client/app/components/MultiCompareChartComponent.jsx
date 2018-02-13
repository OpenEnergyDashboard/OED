/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import CompareChartContainer from '../containers/CompareChartContainer';

export default function MultiCompareChartComponent(props) {
	let size = 3;
	const numSelectedItems = props.selectedMeters.length + props.selectedGroups.length;
	if (numSelectedItems < 3) {
		size = numSelectedItems;
	}

	const centeredStyle = {
		marginTop: '20%'
	};

	// Display a message if no meters are selected
	if (numSelectedItems === 0) {
		return (
			<div className="text-center" style={centeredStyle}>
				Select one or more items to compare usage over time.
			</div>
		);
	}
	const childClassName = `col-12 col-lg-${12 / size}`;

	return (
		<div className="row">
			{props.selectedMeters.map(meterID =>
				<div className={childClassName} key={meterID}>
					<CompareChartContainer key={meterID} id={meterID} isGroup={false} />
				</div>
			)}
			{props.selectedGroups.map(groupID =>
				<div className={childClassName} key={groupID}>
					<CompareChartContainer key={groupID} id={groupID} isGroup />
				</div>
			)}
		</div>
	);
}
