/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { chartTypes } from '../reducers/graph';

/**
 * The type of line readings in actions.
 */
export interface LineReadings {
	[id: number]: {
		[point: number]: [number, number];
	};
}

/**
 * The type of bar readings in actions.
 */
export interface BarReadings {
	[id: number]: Array<[number, number]>;
}

export interface ExportDataSet {
	label: string;
	id: number;
	currentChart: chartTypes;
	exportVals: Array<{x: number, y: number}>;
}
