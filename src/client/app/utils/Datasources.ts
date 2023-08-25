/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DataType, DatasourceID } from '../types/Datasources';

// Signifies that the containing object represents a meter
export const DATA_TYPE_METER = DataType.Meter;
// Signifies that the containing object represents a group of meters and groups
export const DATA_TYPE_GROUP = DataType.Group;

/**
 * Put item's id field in tgt if the item specifies a meter
 * @param tgt The array to perhaps insert an item into
 * @param item The item being considered
 * @returns The modified tgt array
 */
export function metersFilterReduce(tgt: number[], item: DatasourceID) {
	if (item.type === DATA_TYPE_METER) {
		tgt.push(item.value);
	}
	return tgt;
}

/**
 * Put item's id field in tgt if the item specifies a group
 * @param tgt The array to perhaps insert an item into
 * @param item The item being considered
 * @returns The modified tgt array
 */
export function groupsFilterReduce(tgt: number[], item: DatasourceID) {
	if (item.type === DATA_TYPE_GROUP) {
		tgt.push(item.value);
	}
	return tgt;
}
