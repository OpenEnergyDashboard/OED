/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import * as _ from 'lodash';
import { MeterData } from '../types/redux/meters';
import { ConversionArray } from '../types/conversionArray';
import { UnitData, UnitType } from '../types/redux/units';
import { GroupDefinition } from 'types/redux/groups';
import { DataType } from 'types/Datasources';

// TODO I put in comments that should start with TODO. I cannot carefully check the code at this point but a number
// of thoughts are given.

// TODO I'm not sure why this is included.
import meters from 'reducers/meters';

const Meter = require('../../models/Meter');
// TODO There should not be test code in production code. I think you want to include the regular DB code.
const { mocha, expect, testDB } = require('../common');


/**
 * The intersect operation of two sets.
 * @param {Set<number>} setA The first set.
 * @param {Set<number>} setB The second set.
 * @returns {Set<number>} The intersection of two sets.
 */
export function setIntersect(setA: Set<number>, setB: Set<number>): Set<number> {
	return new Set(Array.from(setA).filter(i => setB.has(i)));
}

/**
 * Takes a set of meter ids and returns the set of compatible unit ids.
 * @param {Set<number>} meters The set of meter ids.
 * @returns {Set<number>} The set of compatible units.
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
 * @param {number} unitId The unit id.
 * @returns {Set<number>} The set of units compatible with the given id.
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
 * @param {number} unitId The unit id.
 * @returns {number} The row index.
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
 * @param {number} row The row to find the associated unit.
 * @returns {number} The unit id.
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
 * @param {number} column The column to find the associated unit.
 * @returns {number} The unit id.
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
 * @param {number} groupId The groupId.
 * @returns {Set<number>} the set of deep children of this group
 */
export function metersInGroup(groupId: number): Set<number> {
	const state = store.getState();
	// Gets the group associated with groupId.
	// The deep children are automatically fetched with group state so should exist.
	const group = _.get(state.groups.byGroupID, groupId) as GroupDefinition;
	// Create a set of the deep meters of this group and return it.
	return new Set(group.deepMeters);
}

// TODO All function documentation needs to be correct TSDoc with type and description for each argument and return types.
/**
 * Determine the compatibility of meter/group to the current
 * group being worked on (current group)
 * @param currentGroup
 */
// TODO If this returns nothing then should it be void?
// TODO I think this function needs to be exported to be of use. This is why VSC grays it out.
function compatibilityOfMetersAndGroups(gid: any) {
	//Get the "currentGroup's" compatible units
	//Current groups default graphic unit (via Redux)
	let currentUnits = unitsCompatibleWithMeters(metersInGroup(gid))

	// current groups defaulft graphic unit (via redux)
	let currentDefaultGraphicUnit = gid.defaultGraphicUnit

	// TODO I'm unclear why the comment for this code from the design document is not present.
	// TODO This can be done via Redux instead of a DB connection. See _.find above for examples.
	const conn = testDB.getConnection();
	let meters = Meter.getUnitNotNull(conn);

	meters.forEach(function (m: number) {
		// TODO I know the design document used case that is not okay but casee if not a good variable name.
		let casee = compatibleChanges(currentUnits, m, DataType.Meter, currentDefaultGraphicUnit);
		// TODO cannnot is misspelled.
		// if case 3 then cannnot select so need logic for that
		if (casee = 3) {

		}
		// TODO Lost comment on needing to add to meter menu when that is ready. Follow how done in other parts of the code.
		// TODO The loop for group seems missing.
	});


// TODO What is this commented out code for? I think it is needed to end the function.
// }

/**
 * Returns the state (see groupCase function) for meter or group 
 * provided by id and otherUnits where type is either DataType.Meter or
 * DataType.group
 */
function compatibleChanges(otherUnits: Set<number>, id: number, type: DataType, defaultGraphicUnit: number): number{
	// determine the compatible unites for meter or group represented by id
	let newUnits;
	newUnits = compatibleUnits(id, type);

		// TODO OED does not leave a blank line between a comment and code.
	//Determine case

	let casee = groupCase(otherUnits, newUnits, defaultGraphicUnit); 

	return casee;
}

/**
 * finds all compatible units for this id based on if meter or group. see compatibleChanges
 * for parameter
 * @param id
 * @param type
 */
function compatibleUnits(id: number, type: DataType): Set<number> {
	let newUnits;
	// TODO The formatting is off. VSC will do this automatically.
	if(type == DataType.Meter){
		newUnits = unitsCompatibleWithUnit(id);
	}else {
		// TODO It would be nice if comments that are a sentence start with a capital letter and end with a period.
		//its a group
		//Note we do this once for each time we check all groups so place to 
		//optimize if needed.
		//However, this is done with Redux state so it may be fine to just check each
		//time and do that for now.
		newUnits = unitsCompatibleWithMeters(metersInGroup(id)); 
	}

	return newUnits;
}

/**
 * Returns case covered above 1, 21, 22 or 3 for cases 1, 2.1, 2.2 or 3.
 * currentUnits should be the units already in group
 * newUnits should be the units that will be added
 * COMPLETED
 */
function groupCase(currentUnits: Set<number>, newUnits: Set<number>, defaultGraphicUnit: number): number {
	//The compatible units of a set of meters or groups is the intersection of the compatible units for each
	//Thus, we can get the units that will go away with (- is set subtraction/difference): 
	// lostUnit = currentUnit - ( currentUnit n newUnits)
	let intersection = setIntersect(currentUnits, newUnits);

	let lostUnits = new Set(Array.from(currentUnits).filter(x => !intersection.has(x)));
	//do the possible cases
	if (lostUnits.size == 0){
		// TODO It would be best to use an enum for the return value rather than a fixed value.
		// no change
		return 1;
	}else if (lostUnits.size == currentUnits.size){
		// no compatible units left
		return 3;
		// TODO the second part of the if is missing below.
	}else if (defaultGraphicUnit != -99){
		return 22;
	}else{
		// if the default graphic unit is no unit then you can add any meter/group
		return 21;
	}

}
// TODO The code for somethingLikeFont is missing.

// TODO Who is doing the code for when the selected group/meter is changed?

// TODO I think this } is not needed/in the wrong place.
}
