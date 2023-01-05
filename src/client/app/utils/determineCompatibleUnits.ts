/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import * as _ from 'lodash';
import { MeterData } from '../types/redux/meters';
import { ConversionArray } from '../types/conversionArray';
import { UnitData, UnitType } from '../types/redux/units';
import { GroupDefinition } from 'types/redux/groups';

/**
 * The intersect operation of two sets.
 *
 * @param {Set<number>} setA The first set.
 * @param {Set<number>} setB The second set.
 * @returns {Set<number>} The intersection of two sets.
 */
export function setIntersect(setA: Set<number>, setB: Set<number>): Set<number> {
	return new Set(Array.from(setA).filter(i => setB.has(i)));
}

/**
 * Takes a set of meter ids and returns the set of compatible unit ids.
 *
 * @param {Set<number>} meters The set of meter ids.
 * @returns {Set<number>} Set of compatible unit ids.
 */
export function unitsCompatibleWithMeters(meters: Set<number>): Set<number> {
	const state = store.getState();
	// The first meter processed is different since intersection with empty set is empty.
	let first = true;
	// Holds current set of compatible units.
	let compatibleUnits = new Set<number>();
	// Loops over all meters.
	meters.forEach(function (meterId: number) {
		// Gets the meter associated with the meterId.
		const meter = _.get(state.meters.byMeterID, meterId) as MeterData;
		let meterUnits = new Set<number>();
		// If meter had no unit then nothing compatible with it.
		// This probably won't happen but be safe. Note once you have one of these then
		// the final result must be empty set but don't check specially since don't expect.
		if (meter.unitId != -99) {
			// Set of compatible units with this meter.
			meterUnits = unitsCompatibleWithUnit(meter.unitId);
		}
		// meterUnits now has all compatible units.
		if (first) {
			// First meter so all its units are acceptable at this point.
			compatibleUnits = meterUnits;
			first = false;
		} else {
			// Do intersection of compatible units so far with ones for this meters.
			compatibleUnits = setIntersect(compatibleUnits, meterUnits);
		}
	});
	// Now have final compatible units for the provided set of meter
	return compatibleUnits;
}

/**
 * Returns a set of units ids that are compatible with a specific unit id.
 *
 * @param {number} unitId The unit id.
 * @returns {Set<number>} set of units ids that are compatible with specified unit id
 */
export function unitsCompatibleWithUnit(unitId: number): Set<number> {
	// unitSet starts as an empty set.
	const unitSet = new Set<number>();
	// If unit was null in the database then -99. This means there is no unit
	// so nothing is compatible with it. Skip processing and return empty set at end.
	// Do same if pik is not yet available.
	if (unitId != -99 && ConversionArray.pikAvailable()) {
		// The Pik array.
		const pik = ConversionArray.pik;
		// Get the row index in Pik of this unit.
		const row = pRowFromUnit(unitId);
		// The compatible units are all columns with true for Pik where i = row.
		// Loops over all columns of Pik in row.
		for (let k = 0; k < pik[0].length; ++k) {
			if (pik[row][k]) {
				// unit at index k is compatible with meter unit so add to set.
				// Convert index in Pik to unit id.
				unitSet.add(unitFromPColumn(k));
			}
		}
	}
	return unitSet;
}

/**
 * Returns the row index in Pik for a meter unit.
 *
 * @param {number} unitId The unit id.
 * @returns {number} The row index in Pik for given meter unit.
 */
export function pRowFromUnit(unitId: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since this is the row index, type of unit must be meter.
		return o.id == unitId && o.typeOfUnit == UnitType.meter;
	}) as UnitData;
	return unit.unitIndex;
}

/**
 * Returns the unit id given the row in Pik.
 *
 * @param {number} row The row to find the associated unit.
 * @returns {number} The unit id given the row in Pik units.
 */
export function unitFromPRow(row: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since the given unitIndex is a row index, the unit type must be meter.
		return o.unitIndex == row && o.typeOfUnit == UnitType.meter;
	}) as UnitData;
	return unit.id;
}

/**
 * Returns the unit id given the column in Pik.
 *
 * @param {number} column The column to find the associated unit.
 * @returns {number} The unit id given the column in Pik.
 */
export function unitFromPColumn(column: number): number {
	const state = store.getState();
	const unit = _.find(state.units.units, function (o: UnitData) {
		// Since the given unitIndex is a column index, the unit type must be different from meter.
		return o.unitIndex == column && o.typeOfUnit != UnitType.meter;
	}) as UnitData;
	return unit.id;
}

/**
 * Returns the set of meters's ids associated with the groupId used.
 *
 * @param {number} groupId The groupId.
 * @returns {Set<number>} The set of deep children of this group.
 */
export function metersInGroup(groupId: number): Set<number> {
	const state = store.getState();
	// Gets the group associated with groupId.
	// The deep children are automatically fetched with group state so should exist.
	const group = _.get(state.groups.byGroupID, groupId) as GroupDefinition;
	// Create a set of the deep meters of this group and return it.
	return new Set(group.deepMeters);
}
