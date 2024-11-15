/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import IntervalControlsComponent from './IntervalControlsComponent';
import MapChartSelectComponent from './MapChartSelectComponent';

/**
 * @returns controls for map page.
 */
export default function MapControlsComponent() {
	return (
		<div>
			{<IntervalControlsComponent key='interval' />}
			{<MapChartSelectComponent key='chart' />}
		</div >
	);
}
