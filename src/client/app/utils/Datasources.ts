/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export enum DataType {
	Meter = 'DATA_TYPE_METER',
	Group = 'DATA_TYPE_GROUP'
}

// Signifies that the containing object represents a meter
export const DATA_TYPE_METER = DataType.Meter;
// Signifies that the containing object represents a group of meters and groups
export const DATA_TYPE_GROUP = DataType.Group;

interface GroupID {
	type: 'DATA_TYPE_GROUP';
	value: number;
}

interface MeterID {
	type: 'DATA_TYPE_METER';
	value: number;
}

type DatasourceID = GroupID | MeterID;

/**
 * Put item's id field in tgt if the item specifies a meter
 * @param {int[]} tgt The array to perhaps insert an item into
 * @param {{String, int}} item The item being considered
 * @return {Array} The modified tgt array
 */
export function metersFilterReduce(tgt: number[], item: DatasourceID) {
	if (item.type === DATA_TYPE_METER) {
		tgt.push(item.value);
	}
	return tgt;
}

/**
 * Put item's id field in tgt if the item specifies a group
 * @param {int[]} tgt The array to perhaps insert an item into
 * @param {{String, int}} item The item being considered
 * @return {Array} The modified tgt array
 */
export function groupsFilterReduce(tgt: number[], item: DatasourceID) {
	if (item.type === DATA_TYPE_GROUP) {
		tgt.push(item.value);
	}
	return tgt;
}
