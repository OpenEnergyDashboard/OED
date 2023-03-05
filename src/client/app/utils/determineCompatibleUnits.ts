/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import * as _ from 'lodash';
import { MeterData } from '../types/redux/meters';
import { ConversionArray } from '../types/conversionArray';
import { UnitData, UnitType } from '../types/redux/units';
import { GroupData, GroupDefinition, GroupID } from '../types/redux/groups';
import { DataType } from '../types/Datasources';
import { State } from '../types/redux/state';
import { SelectOption } from '../types/items';
import { groupsApi } from './api';

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
 * @returns {Set<number>} Set of units ids that are compatible with specified unit id.
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

/**
 * Get options for the meter menu on the group page.
 * @param gid The group's id.
 * @param defaultGraphicUnit The groups current default graphic unit which may have been updated from what is in Redux state.
 * @param deepMeters The groups current deep meters (all recursively) which may have been updated from what is in Redux state.
 * @return The current meter options for this group. 
 */
export function getMeterMenuOptionsForGroup(gid: number, defaultGraphicUnit: number, deepMeters: number[] = []): SelectOption[] {
	// deepMeters has a default value since it is optional for the type of state but it should always be set in the code.
	const state = store.getState() as State;
	// Get the currentGroup's compatible units. We need to use the current deep meters to get it right.
	// First must get a set from the array of meter numbers.
	const deepMetersSet = new Set(deepMeters);
	// Get the units that are compatible with this set of meters.
	const currentUnits = unitsCompatibleWithMeters(deepMetersSet);
	// Get all meters' state.
	const meters = Object.values(state.meters.byMeterID) as MeterData[];

	// Options for the meter menu.
	const options: SelectOption[] = [];
	// For each meter, decide its compatibility for the menu
	meters.forEach((meter: MeterData) => {
		const option = {
			label: meter.identifier,
			value: meter.id,
			isDisabled: false,
			style: {}
		} as SelectOption;

		const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, meter.id, DataType.Meter, defaultGraphicUnit);
		if (compatibilityChangeCase === GroupCase.NoCompatibleUnits) {
			// This meter was not compatible with the ones in the group so disable it as a choice.
			option.isDisabled = true;
		} else {
			// This meter is compatible but need to decide what impact choosing it will have on the group.
			option.style = getMenuOptionFont(compatibilityChangeCase);
		}
		options.push(option);
	});

	// We want the options sorted by meter identifier.
	return _.sortBy(options, item => item.label.toLowerCase(), 'asc');
}

/**
 * Get options for the group menu on the group page.
 * @param gid The group's id.
 */
export function getGroupMenuOptionsForGroup(gid: number): SelectOption[] {
	const state = store.getState() as State;
	// Get the currentGroup's compatible units.
	const currentUnits = unitsCompatibleWithMeters(metersInGroup(gid));
	// Current group's default graphic unit (via Redux).
	const defaultGraphicUnit = state.groups.byGroupID[gid].defaultGraphicUnit;
	// Get all groups.
	const groups = Object.values(state.groups.byGroupID) as GroupDefinition[];

	// Options for the group menu.
	const options: SelectOption[] = [];

	groups.forEach((group: GroupDefinition) => {
		const option = {
			label: group.name,
			value: group.id,
			isDisabled: false,
			style: {}
		} as SelectOption;

		const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, group.id, DataType.Group, defaultGraphicUnit);
		if (compatibilityChangeCase === GroupCase.NoCompatibleUnits) {
			option.isDisabled = true;
		} else {
			option.style = getMenuOptionFont(compatibilityChangeCase);
		}

		options.push(option);
	});

	return options;
}

/**
 * Validates and warns user when adding a child group/meter to a specific group.
 * If the check pass, update the edited group and related groups.
 * @param gid The id of the group to assign the child.
 * @param childId The group/meter's id to add to the parent group.
 * @param childType Can be group or meter.
 */
export async function assignChildToGroup(gid: number, childId: number, childType: DataType): Promise<void> {
	const state = store.getState() as State;
	// Get the group to add the child.
	// Note that this is not a deep copy. Changes make to this object will change the redux state.
	const group = state.groups.byGroupID[gid];
	// Create a deep copy of the group before adding the child.
	// At the end, if the check fails or if admin doesn't want to apply the change, we set the redux state to this copy.
	const oldGroup = JSON.parse(JSON.stringify(group));
	// Add the child to this group.
	if (childType === DataType.Meter) {
		group.childMeters.push(childId);
		group.deepMeters.push(childId);
	} else {
		group.childGroups.push(childId);
		// Uses set here so the deep meters are not duplicated.
		const deepMeters = new Set(group.deepMeters.concat(state.groups.byGroupID[childId].deepMeters));
		group.deepMeters = Array.from(deepMeters);
	}
	// Get all parent groups of this group.
	const parentGroupIDs = await groupsApi.getParentIDs(gid);
	const shouldUpdate = await validateGroupPostAddChild(gid, parentGroupIDs);
	// If the admin wants to apply changes.
	if (shouldUpdate) {
		// Update related groups.
		for (const parentID of parentGroupIDs) {
			const parentGroup = state.groups.byGroupID[parentID] as GroupDefinition;
			// Get parent's compatible units
			const parentCompatibleUnits = unitsCompatibleWithMeters(metersInGroup(parentID));
			// Get compatibility change case when add this group to its parent.
			const compatibilityChangeCase = getCompatibilityChangeCase(parentCompatibleUnits, gid, DataType.Group, parentGroup.defaultGraphicUnit);
			if (compatibilityChangeCase === GroupCase.LostDefaultGraphicUnit) {
				// For parent groups, only default graphic units are affected.
				parentGroup.defaultGraphicUnit = -99;
				await applyChangesToGroup(parentGroup);
			}
		}
		// Update the group. Now, the changes actually happen.
		await applyChangesToGroup(group);
	} else {
		// Reset the redux state for this gorup.
		state.groups.byGroupID[gid] = oldGroup;
	}
}

/**
 * Determines if the change in compatible units of one group are okay with another group.
 * Warns admin of changes and returns true if the changes should happen.
 * @param gid The group that has a change in compatible units.
 * @param parentGroupIDs The parent groups' ids of that group.
 */
async function validateGroupPostAddChild(gid: number, parentGroupIDs: number[]): Promise<boolean> {
	const state = store.getState() as State;
	// This will hold the overall message for the admin alert.
	let msg = '';
	// Tells if the change should be cancelled.
	let cancel = false;
	for (const parentID of parentGroupIDs) {
		const parentGroup = state.groups.byGroupID[parentID] as GroupDefinition;
		// Get parent's compatible units
		const parentCompatibleUnits = unitsCompatibleWithMeters(metersInGroup(parentID));
		// Get compatibility change case when add this group to its parent.
		const compatibilityChangeCase = getCompatibilityChangeCase(parentCompatibleUnits, gid, DataType.Group, parentGroup.defaultGraphicUnit);
		switch (compatibilityChangeCase) {
			case GroupCase.NoCompatibleUnits:
				msg += `Group ${parentGroup.name} would have no compatible units by the edit to this group so the edit is cancelled\n`;
				cancel = true;
				break;

			case GroupCase.LostDefaultGraphicUnit:
				msg += `Group ${parentGroup.name} will have its compatible units changed and its default graphic unit set to no unit by the edit to this group\n`;
				break;

			case GroupCase.LostCompatibleUnits:
				msg += `Group ${parentGroup.name} will have its compatible units changed by the edit to this group\n`;
				break;

			// Case NoChange requires no message.
		}
	}
	if (msg !== '') {
		if (cancel) {
			msg += '\nTHE CHANGE TO THE GROUP IS CANCELLED';
			// If cancel is true, doesn't allow the admin to apply changes.
			window.alert(msg);
		} else {
			msg += '\nGiven the messages, do you want to cancel this change or continue?';
			// If msg is not empty, warns the admin and asks if they want to apply changes.
			cancel = !window.confirm(msg);
		}
	}
	return !cancel;
}

/**
 * Calls the api to update a group.
 * @param group The group to update.
 */
async function applyChangesToGroup(group: GroupDefinition): Promise<void> {
	const groupData = {
		id: group.id,
		name: group.name,
		displayable: group.displayable,
		gps: group.gps,
		note: group.note,
		area: group.area,
		childGroups: group.childGroups,
		childMeters: group.childMeters,
		defaultGraphicUnit: group.defaultGraphicUnit
	} as GroupData & GroupID;
	const state = store.getState() as State;
	// Update Redux state.
	state.groups.byGroupID[group.id] = group;
	// Update database.
	await groupsApi.edit(groupData);
}

/**
 * The four cases that could happen when adding a group/meter to a group:
 * 	- NoChange: Adding this meter/group will not change the compatible units for the group.
 *  - LostCompatibleUnits: The meter/group is compatible with the default graphic unit although some compatible units are lost.
 *  - LostDefaultGraphicUnits: The meter/group is not compatible with the default graphic unit but there exists some compatible untis.
 *  - NoCompatibleUnits: The meter/group will cause the compatible units for the group to be empty.
 */
export const enum GroupCase {
	NoChange = 'NO_CHANGE',
	LostCompatibleUnits = 'LOST_COMPATIBLE_UNITS',
	LostDefaultGraphicUnit = 'LOST_DEFAULT_GRAPHIC_UNIT',
	NoCompatibleUnits = 'NO_COMPATIBLE_UNITS'
}

/**
 * Return the case associated if we add the given meter/group to a group.
 * @param currentUnits The current compatible units of the group.
 * @param idToAdd The meter/group's id to add to the group.
 * @param type Can be METER or GROUP.
 * @param currentDefaultGraphicUnit The default graphic unit.
 */
function getCompatibilityChangeCase(currentUnits: Set<number>, idToAdd: number, type: DataType, currentDefaultGraphicUnit: number): GroupCase {
	// Determine the compatible units for meter or group represented by the id.
	const newUnits = getCompatibleUnits(idToAdd, type);
	// Returns the associated case.
	return groupCase(currentUnits, newUnits, currentDefaultGraphicUnit);
}

/**
 * Given a meter or group's id, returns its compatible units.
 * @param id The meter or group's id.
 * @param type Can be Meter or Group.
 */
function getCompatibleUnits(id: number, type: DataType): Set<number> {
	if (type == DataType.Meter) {
		const state = store.getState();
		// Get the unit id of meter.
		const unitId = state.meters.byMeterID[id].unitId;
		// Returns all compatible units with this unit id.
		return unitsCompatibleWithUnit(unitId);
	} else {
		// Returns all compatible units with this group.
		return unitsCompatibleWithMeters(metersInGroup(id));
	}
}

/**
 * Returns the group case given current units and new units. See the enum GroupCase for the list of possible cases.
 * @param currentUnits The current compatible units set.
 * @param newUnits The new compatible units set.
 * @param defaultGraphicUnit The default graphic unit.
 */
function groupCase(currentUnits: Set<number>, newUnits: Set<number>, defaultGraphicUnit: number): GroupCase {
	// The compatible units of a set of meters or groups is the intersection of the compatible units for each
	// Thus, we can get the units that will go away with (- is set subtraction/difference):
	// lostUnit = currentUnit - ( currentUnit n newUnits)
	const intersection = setIntersect(currentUnits, newUnits);
	const lostUnits = new Set(Array.from(currentUnits).filter(x => !intersection.has(x)));

	if (lostUnits.size == 0) {
		return GroupCase.NoChange;
	} else if (lostUnits.size == currentUnits.size) {
		return GroupCase.NoCompatibleUnits;
	} else if (defaultGraphicUnit != -99 && lostUnits.has(defaultGraphicUnit)) {
		return GroupCase.LostDefaultGraphicUnit;
	} else {
		// if the default graphic unit is no unit then you can add any meter/group
		return GroupCase.LostCompatibleUnits;
	}
}

function getMenuOptionFont(compatibilityChangeCase: GroupCase): React.CSSProperties {
	switch (compatibilityChangeCase) {
		case GroupCase.NoChange:
			return { color: 'black' };

		case GroupCase.LostCompatibleUnits:
			return { color: 'yellow' };

		case GroupCase.LostDefaultGraphicUnit:
			return { color: 'red' };

		default:
			// Should never reach here.
			return {}
	}
}
