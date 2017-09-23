/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Signifies that the containing object represents a meter
export const DATA_TYPE_METER = 'DATA_TYPE_METER';
// Signifies that the containing object represents a group of meters and groups
export const DATA_TYPE_GROUP = 'DATA_TYPE_GROUP';

/**
 * Put item's id field in tgt if the item specifies a meter
 * @param {int[]} tgt The array to perhaps insert an item into
 * @param {{String, int}} item The item being considered
 * @return {Array} The modified tgt array
 */
export function metersFilterReduce(tgt, item) {
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
export function groupsFilterReduce(tgt, item) {
	if (item.type === DATA_TYPE_GROUP) {
		tgt.push(item.value);
	}
}
