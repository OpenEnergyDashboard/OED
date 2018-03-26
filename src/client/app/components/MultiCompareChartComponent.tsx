/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import CompareChartContainer from '../containers/CompareChartContainer';
import { Entity } from '../containers/MultiCompareChartContainer';

interface MultiCompareChartProps {
	selectedMeters: Entity[];
	selectedGroups: Entity[];
}

export default function MultiCompareChartComponent(props: MultiCompareChartProps) {
	// Compute how much space should be used in the bootstrap grid system
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
			<div className='text-center' style={centeredStyle}>
				Select one or more items to compare usage over time.
			</div>
		);
	}
	const childClassName = `col-12 col-lg-${12 / size}`;

	return (
		<div className='row'>
			{props.selectedMeters.map(meter =>
				<div className={childClassName} key={meter.id}>
					<CompareChartContainer
						key={meter.id}
						entity={meter}
					/>
				</div>
			)}
			{props.selectedGroups.map(group =>
				<div className={childClassName} key={group.id}>
					<CompareChartContainer
						key={group.id}
						entity={group}
					/>
				</div>
			)}
		</div>
	);
}
