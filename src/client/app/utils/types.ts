/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DataType } from './Datasources';

/**
 * The type of options displayed in Select components.
 */
export interface SelectOption {
	label: string;
	value: number;
}

export interface DataTyped {
	type: DataType;
}

export interface NamedIDItem {
	id: number;
	name: string;
}

export interface LineReadings {
	[id: number]: {
		[point: number]: Array<[number, number]>;
	};
}

export interface BarReadings {
	[id: number]: Array<[number, number]>;
}
