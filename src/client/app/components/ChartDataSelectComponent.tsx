/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { MeterOrGroup } from '../types/redux/graph';
import MeterAndGroupSelectComponent from './MeterAndGroupSelectComponent';
import UnitSelectComponent from './UnitSelectComponent';

/**
 * A component which allows the user to select which data should be displayed on the chart.
 * @returns Chart data select element
 */
export default function ChartDataSelectComponent() {

	return (
		<div>
			<MeterAndGroupSelectComponent meterOrGroup={MeterOrGroup.groups} />
			<MeterAndGroupSelectComponent meterOrGroup={MeterOrGroup.meters} />
			<UnitSelectComponent />
		</div>
	);
}