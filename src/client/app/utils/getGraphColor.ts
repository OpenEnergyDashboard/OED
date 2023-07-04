/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DataType } from '../types/Datasources';

// Color list (47 colors) with darker hues towards beginning of array and lighter hues towards end of array.
// The array length was made a prime number just in case the IDs are not ordered because it better scrambles
// values as in a hash table.
const graphColors = [
	'#1b2631', '#78281f', '#4a235a', '#1b4f72', '#0b5345', '#186a3b', '#7e5109', '#6e2c00',
	'#515a5a', '#7b241c', '#633974', '#1a5276', '#117864', '#196f3d', '#9a7d0a', '#935116',
	'#283747', '#b03a2e', '#6c3483', '#2874a6', '#117a65', '#239b56', '#b9770e', '#a04000',
	'#707b7c', '#a93226', '#884ea0', '#2471a3', '#17a589', '#229954', '#d4ac0d', '#ca6f1e',
	'#34495e', '#e74c3c', '#8e44ad', '#3498db',	'#16a085', '#2ecc71', '#f39c12', '#d35400',
	'#99a3a4', '#cd6155', '#af7ac5', '#5499c7', '#48c9b0', '#52be80', '#f4d03f'
];

// Creates a reversed copy of the original array with lighter hues towards beginning of array and darker towards the end.
const graphColorsReversed = [...graphColors].reverse();

// Note that we could have two arrays with non-overlapping colors, one for meter colors and one for group
// colors. We use this design to ensure no color repetition until there are collectively more than 48
// (the number of unique colors in the array) meters/groups to graph, since we expect IDs to start at 1
// and increment by 1. Furthermore, this specific array allows for easy visual distinction between meter
// data (lighter colors) and group data (darker colors) while also maintaining a sufficiently large
// selection of graphing colors.

/**
 * Selects a color from the graphColor array based based on the type of data to be graphed
 * @param colorID the number of the meter or group to be graphed. Starts at '1' for both meters and groups
 * and increases as more meters or groups respectively need to be graphed.
 * @param type either 'DataType.Meter' or 'DataType.Group' depending on the type of the data to be graphed
 * @returns Hex color
 */
export default function getGraphColor(colorID: number, type: DataType): string {
	// Shifts indices of positive IDs down by 1 since expect IDs to start at 1, and additionally maps unlikely
	// negative IDs to positive indices (error-checking). This ensures the index is always positive.
	let index = (colorID > 0) ? (colorID - 1) : (-colorID);

	if (type === DataType.Meter) {
		// Wrap color to lie within array for meters.
		index = index % graphColorsReversed.length;
		return graphColorsReversed[index];
	} else if (type === DataType.Group) {
		// Wrap color to lie with array for groups.
		index = index % graphColors.length;
		return graphColors[index];
	} else {
		throw new Error('Invalid arguments in getGraphColor: expected second argument either \'DataType.Meter\' or \'DataType.Group\'');
	}
}
