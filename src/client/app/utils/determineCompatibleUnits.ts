/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO it is a bad practice to import store anywhere other than index.tsx These utils need to be converted into selectors.
import { get } from 'lodash';
import React from 'react';
import { selectCik } from '../redux/api/conversionsApi';
import { selectAllGroups, selectGroupDataById } from '../redux/api/groupsApi';
import { selectAllMeters, selectMeterDataById } from '../redux/api/metersApi';
import { store } from '../store';
import { DataType } from '../types/Datasources';
import { SelectOption } from '../types/items';
import { GroupData } from '../types/redux/groups';
import { LanguageTypes } from 'types/redux/i18n';

/**
 * The intersect operation of two sets.
 * @param setA The first set.
 * @param setB The second set.
 * @returns The intersection of two sets.
 */
export function setIntersect(setA: Set<number>, setB: Set<number>): Set<number> {
	return new Set(Array.from(setA).filter(i => setB.has(i)));
}

/**
 * Takes a set of meter ids and returns the set of compatible unit ids.
 * @param meters The set of meter ids.
 * @returns Set of compatible unit ids.
 */
export function unitsCompatibleWithMeters(meters: Set<number>): Set<number> {
	const meterDataByID = selectMeterDataById(store.getState());

	// The first meter processed is different since intersection with empty set is empty.
	let first = true;
	// Holds current set of compatible units.
	let compatibleUnits = new Set<number>();
	// Loops over all meters.
	meters.forEach(function (meterId: number) {
		// Gets the meter associated with the meterId.
		const meter = get(meterDataByID, meterId);
		let meterUnits = new Set<number>();
		// If meter had no unit then nothing compatible with it.
		// This probably won't happen but be safe. Note once you have one of these then
		// the final result must be empty set but don't check specially since don't expect.
		// null meter can crash on startup without undef check here
		if (meter && meter.unitId != -99) {
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
 * @param unitId The unit id
 * @returns a set of compatible unit ids
 */
export function unitsCompatibleWithUnit(unitId: number): Set<number> {
	// access the global state
	const state = store.getState();
	const unitSet = new Set<number>();
	// get all ciks data
	const globalCiksState = selectCik(state);
	// If unit was null in the database then -99. This means there is no unit
	// so nothing is compatible with it. Skip processing and return empty set at end.
	if (unitId !== -99) {
		// loop through each cik to find ones whose meterUnitId equals unitId param
		// then add the corresponding nonMeterUnitId to the unitSet
		for (const cik of globalCiksState) {
			if (cik.meterUnitId === unitId) {
				unitSet.add(cik.nonMeterUnitId);
			}
		}
	}
	return unitSet;
}

/**
 * Returns the set of meters's ids associated with the groupId used where Redux
 * state is accurate for all groups.
 * @param groupId The groupId.
 * @returns The set of deep children of this group.
 */
export function metersInGroup(groupId: number): Set<number> {
	const state = store.getState();
	// Gets the group associated with groupId.
	// The deep children are automatically fetched with group state so should exist.
	const groupDataById = selectGroupDataById(state);
	const group = get(groupDataById, groupId);
	// Create a set of the deep meters of this group and return it.
	// null group can break on startup without optional chain
	return new Set(group?.deepMeters);
}

/**
 * Returns array of deep meter ids of the changed group. This only works if all other groups in state
 * do not include this group.
 * @param changedGroupState The state for the changed group
 * @returns array of deep meter ids of the changed group considering possible changes
 */
export function metersInChangedGroup(changedGroupState: GroupData): number[] {
	const state = store.getState();
	const groupDataById = selectGroupDataById(state);

	// deep meters starts with all the direct child meters of the group being changed.
	const deepMeters = new Set(changedGroupState.childMeters);
	// These groups cannot contain the group being changed so the redux state is okay.
	changedGroupState.childGroups.forEach((group: number) => {
		// The group state for the current child group.
		const groupState = get(groupDataById, group);
		// The group state might not be defined, e.g., a group delete happened and the state is refreshing.
		// In this case the deepMeters returned will be off but they should quickly refresh.
		if (groupState) {
			// The deep meters of every group contained in the changed group are in that group.
			// The set does not allow duplicates so no issue there.
			groupState.deepMeters.forEach((meter: number) => {
				deepMeters.add(meter);
			});
		}
	});
	// Convert set to array.
	return Array.from(deepMeters);
}

/**
 * Get options for the meter menu on the group page.
 * @param defaultGraphicUnit The groups current default graphic unit which may have been updated from what is in Redux state.
 * @param deepMeters The groups current deep meters (all recursively) which may have been updated from what is in Redux state.
 * @param locale Current language from Redux state.
 * @returns The current meter options for this group.
 */
export function getMeterMenuOptionsForGroup(defaultGraphicUnit: number, deepMeters: number[] = [], locale: LanguageTypes): SelectOption[] {
	// deepMeters has a default value since it is optional for the type of state but it should always be set in the code.
	const state = store.getState();
	// Get the currentGroup's compatible units. We need to use the current deep meters to get it right.
	// First must get a set from the array of meter numbers.
	const deepMetersSet = new Set(deepMeters);
	// Get the units that are compatible with this set of meters.
	const currentUnits = unitsCompatibleWithMeters(deepMetersSet);
	// Get all meters' state.
	const meterData = selectAllMeters(state);

	// Options for the meter menu.
	const options: SelectOption[] = [];
	// For each meter, decide its compatibility for the menu
	meterData.forEach(meter => {
		const option = {
			label: meter.identifier,
			value: meter.id,
			isDisabled: false,
			style: {}
		} as SelectOption;

		const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, meter.id, DataType.Meter, defaultGraphicUnit, []);
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
	// Had to make item.label? potentially undefined due to start up race conditions
	return options.sort((itemA, itemB) => itemA.label.toLowerCase()?.
		localeCompare(itemB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));
}

/**
 * Get options for the group menu on the group page.
 * @param groupId The id of the group being worked on.
 * @param defaultGraphicUnit The group's current default graphic unit which may have been updated from what is in Redux state.
 * @param deepMeters The group's current deep meters (all recursively) which may have been updated from what is in Redux state.
 * @param locale Current language from Redux state.
 * @returns The current group options for this group.
 */
export function getGroupMenuOptionsForGroup(groupId: number, defaultGraphicUnit: number, deepMeters: number[] = [], locale: LanguageTypes):
SelectOption[] {
	// Get the currentGroup's compatible units. We need to use the current deep meters to get it right.
	// First must get a set from the array of meter numbers.
	const deepMetersSet = new Set(deepMeters);
	// Get the currentGroup's compatible units.
	const currentUnits = unitsCompatibleWithMeters(deepMetersSet);
	// Get all groups' state.
	const groupData = selectAllGroups(store.getState());

	// Options for the group menu.
	const options: SelectOption[] = [];

	groupData.forEach(group => {
		// You cannot have yourself in the group so not an option.
		if (group.id !== groupId) {
			const option = {
				label: group.name,
				value: group.id,
				isDisabled: false,
				style: {}
			} as SelectOption;

			const compatibilityChangeCase = getCompatibilityChangeCase(currentUnits, group.id, DataType.Group, defaultGraphicUnit, group.deepMeters);
			if (compatibilityChangeCase === GroupCase.NoCompatibleUnits) {
				option.isDisabled = true;
			} else {
				option.style = getMenuOptionFont(compatibilityChangeCase);
			}

			options.push(option);
		}
	});

	// We want the options sorted by group name.
	// Had to make item.label? potentially undefined due to start up race conditions
	return options.sort((itemA, itemB) => itemA.label.toLowerCase()?.
		localeCompare(itemB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));

}

/**
 * The four cases that could happen when adding a group/meter to a group:
 * 	- NoChange: Adding this meter/group will not change the compatible units for the group.
 *  - LostCompatibleUnits: The meter/group is compatible with the default graphic unit although some compatible units are lost.
 *  - LostDefaultGraphicUnits: The meter/group is not compatible with the default graphic unit but there exists some compatible units.
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
 * @param currentDefaultGraphicUnit The default graphic unit for group changing
 * @param deepMeters The deep meters for the group, ignored if meter
 * @returns the type of change this involves.
 */
export function getCompatibilityChangeCase(currentUnits: Set<number>, idToAdd: number, type: DataType,
	currentDefaultGraphicUnit: number, deepMeters: number[]): GroupCase {
	// Determine the compatible units for meter or group represented by the id.
	const newUnits = getCompatibleUnits(idToAdd, type, deepMeters);
	// Returns the associated case.
	return groupCase(currentUnits, newUnits, currentDefaultGraphicUnit);
}

/**
 * Given a meter or group's id, returns its compatible units.
 * @param id The meter or group's id.
 * @param type Can be Meter or Group.
 * @param deepMeters The deep meter of the id if it is a group, ignored if meter.
 * @returns Set of ids of compatible units.
 */
function getCompatibleUnits(id: number, type: DataType, deepMeters: number[]): Set<number> {
	if (type == DataType.Meter) {
		const state = store.getState();
		const meterDataByID = selectMeterDataById(state);
		// Get the unit id of meter.
		const unitId = meterDataByID[id].unitId;
		// Returns all compatible units with this unit id.
		return unitsCompatibleWithUnit(unitId);
	} else {
		// Returns all compatible units with this group.
		return unitsCompatibleWithMeters(new Set(deepMeters));
	}
}

/**
 * Returns the group case given current units and new units. See the enum GroupCase for the list of possible cases.
 * @param currentUnits The current compatible units set.
 * @param newUnits The new compatible units set.
 * @param defaultGraphicUnit The default graphic unit.
 * @returns of impact on units from current to new unit sets.
 */
function groupCase(currentUnits: Set<number>, newUnits: Set<number>, defaultGraphicUnit: number): GroupCase {
	// The compatible units of a set of meters or groups is the intersection of the compatible units for each.
	// Thus, we can get the units that will go away with (- is set subtraction/difference):
	// lostUnit = currentUnit - ( currentUnit n newUnits)
	const intersection = setIntersect(currentUnits, newUnits);
	const lostUnits = new Set(Array.from(currentUnits).filter(x => !intersection.has(x)));

	if (lostUnits.size == 0) {
		return GroupCase.NoChange;
	} else if (lostUnits.size == currentUnits.size) {
		return GroupCase.NoCompatibleUnits;
	} else if (defaultGraphicUnit != -99 && lostUnits.has(defaultGraphicUnit)) {
		// The current default graphic unit is not no unit and it is still in the new ones.
		return GroupCase.LostDefaultGraphicUnit;
	} else {
		// if the default graphic unit is no unit then you can add any meter/group
		return GroupCase.LostCompatibleUnits;
	}
}

/**
 * Returns the styling for the menu for the type of change in in GroupCase
 * @param compatibilityChangeCase Which GroupCase is involved.
 * @returns the desired color for styling.
 */
function getMenuOptionFont(compatibilityChangeCase: GroupCase): React.CSSProperties {
	switch (compatibilityChangeCase) {
		case GroupCase.NoChange:
			return { color: 'black' };

		case GroupCase.LostCompatibleUnits:
			return { color: 'orange' };

		case GroupCase.LostDefaultGraphicUnit:
			return { color: 'red' };

		default:
			// Should never reach here.
			return {};
	}
}
