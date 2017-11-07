/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import CompareChartContainer from '../containers/CompareChartContainer';

export default function MultiCompareChartComponent(props) {
	// how much space should be used in the bootstrap grid syststem
	let size;
	if (props.selectedMeters.length === 1) {
		size = 12;
	} else if (props.selectedMeters.length === 2) {
		size = 6;
	} else {
		size = 4;
	}
	return (
		<div className="row">
			{props.selectedMeters.map(meterID =>
				<div key={meterID} className={`col-xs-${size}`}>
					<CompareChartContainer key={meterID} id={meterID} />
				</div>
			)}
		</div>
	);
}