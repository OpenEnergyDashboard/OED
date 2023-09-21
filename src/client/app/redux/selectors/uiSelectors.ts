/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { RootState } from '../../store';
import { DataType } from '../../types/Datasources';
import { ChartTypes, MeterOrGroup } from '../../types/redux/graph';
import { DisplayableType, UnitData, UnitRepresentType, UnitType, UnitsState } from '../../types/redux/units';
import {
	CartesianPoint, Dimensions, calculateScaleFromEndpoints, gpsToUserGrid,
	itemDisplayableOnMap, itemMapInfoOk, normalizeImageDimensions
} from '../../utils/calibration';
import { metersInGroup, unitsCompatibleWithMeters } from '../../utils/determineCompatibleUnits';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { instanceOfGroupsState, instanceOfMetersState, instanceOfUnitsState } from '../../components/ChartDataSelectComponent';
import { SelectOption, GroupedOption } from '../../types/items';
import { MetersState } from '../../types/redux/meters';
import { GroupsState } from '../../types/redux/groups';


export const selectSelectedMeters = (state: RootState) => state.graph.selectedMeters;
export const selectSelectedGroups = (state: RootState) => state.graph.selectedGroups;
export const selectCurrentUser = (state: RootState) => state.currentUser;
export const selectGraphTimeInterval = (state: RootState) => state.graph.timeInterval;
export const selectGraphUnitID = (state: RootState) => state.graph.selectedUnit;
export const selectGraphAreaNormalization = (state: RootState) => state.graph.areaNormalization;
export const selectChartToRender = (state: RootState) => state.graph.chartToRender;
export const selectMeterState = (state: RootState) => state.meters;
export const selectGroupState = (state: RootState) => state.groups;
export const selectUnitState = (state: RootState) => state.units;
export const selectMapState = (state: RootState) => state.maps;

export const selectVisibleMetersAndGroups = createSelector(
	[selectMeterState, selectGroupState, selectCurrentUser],
	(meterState, groupState, currentUser) => {
		// Holds all meters visible to the user
		const visibleMeters = new Set<number>();
		const visibleGroups = new Set<number>();

		// Get all the meters that this user can see.
		if (currentUser.profile?.role === 'admin') {
			// Can see all meters
			Object.values(meterState.byMeterID).forEach(meter => {
				visibleMeters.add(meter.id);
			});
			Object.values(groupState.byGroupID).forEach(group => {
				visibleGroups.add(group.id);
			});
		}
		else {
			// Regular user or not logged in so only add displayable meters
			Object.values(meterState.byMeterID).forEach(meter => {
				if (meter.displayable) {
					visibleMeters.add(meter.id);
				}
			});
			Object.values(groupState.byGroupID).forEach(group => {
				if (group.displayable) {
					visibleGroups.add(group.id);
				}
			});
		}
		return { meters: visibleMeters, groups: visibleGroups }
	}
);

export const selectMeterGroupUnitCompatibility = createSelector(
	[selectVisibleMetersAndGroups, selectMeterState, selectGroupState, selectUnitState, selectGraphUnitID, selectGraphAreaNormalization],
	(visible, meterState, groupState, unitState, graphUnitID, graphAreaNorm) => {
		// meters and groups that can graph
		const compatibleMeters = new Set<number>();
		const compatibleGroups = new Set<number>();

		// meters and groups that cannot graph.
		const incompatibleMeters = new Set<number>();
		const incompatibleGroups = new Set<number>();

		if (graphUnitID === -99) {
			// No unit is selected then no meter/group should be selected.
			// In this case, every meter is valid (provided it has a default graphic unit)
			// If the meter/group has a default graphic unit set then it can graph, otherwise it cannot.
			visible.meters.forEach(meterId => {
				const meterGraphingUnit = meterState.byMeterID[meterId].defaultGraphicUnit;
				if (meterGraphingUnit === -99) {
					//Default graphic unit is not set
					incompatibleMeters.add(meterId);
				}
				else {
					//Default graphic unit is set
					if (graphAreaNorm && unitState.units[meterGraphingUnit] && unitState.units[meterGraphingUnit].unitRepresent === UnitRepresentType.raw) {
						// area normalization is enabled and meter type is raw
						incompatibleMeters.add(meterId);
					} else {
						compatibleMeters.add(meterId);
					}
				}
			});
			visible.groups.forEach(groupId => {
				const groupGraphingUnit = groupState.byGroupID[groupId].defaultGraphicUnit;
				if (groupGraphingUnit === -99) {
					//Default graphic unit is not set
					incompatibleGroups.add(groupId);
				}
				else {
					//Default graphic unit is set
					if (graphAreaNorm && unitState.units[groupGraphingUnit] &&
						unitState.units[groupGraphingUnit].unitRepresent === UnitRepresentType.raw) {
						// area normalization is enabled and meter type is raw
						incompatibleGroups.add(groupId);
					} else {
						compatibleGroups.add(groupId);
					}
				}
			});
		} else {
			// A unit is selected
			// For each meter get all of its compatible units
			// Then, check if the selected unit exists in that set of compatible units
			visible.meters.forEach(meterId => {
				// Get the set of units compatible with the current meter
				const compatibleUnits = unitsCompatibleWithMeters(new Set<number>([meterId]));
				if (compatibleUnits.has(graphUnitID)) {
					// The selected unit is part of the set of compatible units with this meter
					compatibleMeters.add(meterId);
				}
				else {
					// The selected unit is not part of the compatible units set for this meter
					incompatibleMeters.add(meterId);
				}
			});
			visible.groups.forEach(groupId => {
				// Get the set of units compatible with the current group (through its deepMeters attribute)
				// TODO If a meter in a group is not visible to this user then it is not in Redux state and this fails.
				const compatibleUnits = unitsCompatibleWithMeters(metersInGroup(groupId));
				if (compatibleUnits.has(graphUnitID)) {
					// The selected unit is part of the set of compatible units with this group
					compatibleGroups.add(groupId);
				}
				else {
					// The selected unit is not part of the compatible units set for this group
					incompatibleGroups.add(groupId);
				}
			});
		}

		return { compatibleMeters, incompatibleMeters, compatibleGroups, incompatibleGroups }
	}
)

export const selectMeterGroupStateCompatability = createSelector(
	selectMeterGroupUnitCompatibility,
	selectGraphAreaNormalization,
	selectChartToRender,
	selectMeterState,
	selectGroupState,
	selectMapState,
	selectSelectedMeters,
	selectSelectedGroups,
	selectGraphUnitID,
	(unitCompat, areaNormalization, chartToRender, meterState, groupState, mapState, selectedMeters, selectedGroups, selectedUnitID) => {
		// Deep Copy previous selector's values, and update as needed based on current state, like area norm, and map, etc.
		const currentIncompatibleMeters = new Set<number>(Array.from(unitCompat.incompatibleMeters));
		const currentIncompatibleGroups = new Set<number>(Array.from(unitCompat.incompatibleGroups));
		const currentCompatibleMeters = new Set<number>(Array.from(unitCompat.compatibleMeters));
		const currentCompatibleGroups = new Set<number>(Array.from(unitCompat.compatibleGroups));

		// only run this check if area normalization is on
		if (areaNormalization) {
			unitCompat.compatibleMeters.forEach(meterID => {
				// do not allow meter to be selected if it has zero area or no area unit
				if (meterState.byMeterID[meterID].area === 0 || meterState.byMeterID[meterID].areaUnit === AreaUnitType.none) {
					currentCompatibleMeters.delete(meterID)
					currentIncompatibleMeters.add(meterID);
				}
			});
			unitCompat.compatibleGroups.forEach(groupID => {
				// do not allow group to be selected if it has zero area or no area unit
				if (groupState.byGroupID[groupID].area === 0 || groupState.byGroupID[groupID].areaUnit === AreaUnitType.none) {
					currentIncompatibleGroups.add(groupID);
					currentCompatibleGroups.delete(groupID);
				}
			});
		}

		// ony run this check if we are displaying a map chart
		if (chartToRender === ChartTypes.map && mapState.selectedMap !== 0) {
			const mp = mapState.byMapID[mapState.selectedMap];
			// filter meters;
			const image = mp.image;
			// The size of the original map loaded into OED.
			const imageDimensions: Dimensions = {
				width: image.width,
				height: image.height
			};
			// Determine the dimensions so within the Plotly coordinates on the user map.
			const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
			// The following is needed to get the map scale. Now that the system accepts maps that are not
			// pointed north, it would be better to store the origin GPS and the scale factor instead of
			// the origin and opposite GPS. For now, not going to change but could if redo DB and interface
			// for maps.
			// Convert the gps value to the equivalent Plotly grid coordinates on user map.
			// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
			// It must be on true north map since only there are the GPS axes parallel to the map axes.
			// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
			// it coordinates on the true north map and then rotating/shifting to the user map.
			// This is the origin & opposite from the calibration. It is the lower, left
			// and upper, right corners of the user map.
			// The gps value can be null from the database. Note using gps !== null to check for both null and undefined
			// causes TS to complain about the unknown case so not used.
			const origin = mp.origin;
			const opposite = mp.opposite;
			unitCompat.compatibleMeters.forEach(meterID => {
				// This meter's GPS value.
				const gps = meterState.byMeterID[meterID].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
					// (or really any two distinct points) you can calculate this by the change in GPS over the
					// change in x or y which is the map's width & height in this case.
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					// Convert GPS of meter to grid on user map. See calibration.ts for more info on this.
					const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(meterID, DataType.Meter, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid))) {
						currentIncompatibleMeters.add(meterID);
						currentCompatibleMeters.delete(meterID);
					}
				} else {
					// Lack info on this map so skip. This is mostly done since TS complains about the undefined possibility.
					currentIncompatibleMeters.add(meterID);
					currentCompatibleMeters.delete(meterID);
				}
			});

			// The below code follows the logic for meters shown above. See comments above for clarification on the below code.
			unitCompat.compatibleGroups.forEach(groupID => {
				const gps = groupState.byGroupID[groupID].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					const groupGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(groupID, DataType.Group, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, groupGPSInUserGrid))) {
						currentIncompatibleGroups.add(groupID);
						currentCompatibleGroups.delete(groupID);
					}
				} else {
					currentIncompatibleGroups.add(groupID);
					currentCompatibleGroups.delete(groupID);
				}
			});
		}

		// Calculate final compatible meters and groups for dropdown
		const compatibleSelectedMeters = new Set<number>();
		selectedMeters.forEach(meterID => {
			// don't include meters that can't be graphed with current settings
			if (!currentIncompatibleMeters.has(meterID)) {
				compatibleSelectedMeters.add(meterID);
				if (selectedUnitID == -99) {
					// dispatch(changeSelectedUnit(state.meters.byMeterID[meterID].defaultGraphicUnit));
					console.log('TODO FIX ME. MOVE ME TO SELECT LOGIC THERE should be no dispatches inside of selectors')
					// If the selected unit is -99 then there is not graphic unit yet. In this case you can only select a
					// meter that has a default graphic unit because that will become the selected unit. This should only
					// happen if no meter or group is yet selected.
					// If no unit is set then this should always be the first meter (or group) selected.
					// The selectedUnit becomes the unit of the meter selected. Note is should always be set (not -99) since
					// those meters should not have been visible. The only exception is if there are no selected meters but
					// then this loop does not run. The loop is assumed to only run once in this case.
				}
			}
		});


		const compatibleSelectedGroups = new Set<number>();
		selectedGroups.forEach(groupID => {
			// don't include groups that can't be graphed with current settings
			if (!currentIncompatibleGroups.has(groupID)) {
				// If the selected unit is -99 then there is no graphic unit yet. In this case you can only select a
				// group that has a default graphic unit because that will become the selected unit. This should only
				// happen if no meter or group is yet selected.
				if (selectedUnitID == -99) {
					// If no unit is set then this should always be the first group (or meter) selected.
					// The selectedUnit becomes the unit of the group selected. Note is should always be set (not -99) since
					// those groups should not have been visible. The only exception is if there are no selected groups but
					// then this loop does not run. The loop is assumed to only run once in this case.
					// dispatch(changeSelectedUnit(state.groups.byGroupID[groupID].defaultGraphicUnit));
					console.log('TODO FIX ME. MOVE ME TO graphSliceLogic LOGIC THERE should be no dispatches inside of selectors')

				}
				compatibleSelectedGroups.add(groupID);
			}
		});
		// console.log(compatibleSelectedMeters, currentIncompatibleMeters, compatibleSelectedGroups, currentIncompatibleGroups)

		return {
			compatibleSelectedMeters,
			compatibleSelectedGroups,
			currentCompatibleMeters,
			currentCompatibleGroups,
			currentIncompatibleMeters,
			currentIncompatibleGroups
		}
	}
)

export const selectMeterGroupSelectData = createSelector(
	selectMeterGroupStateCompatability,
	selectMeterState,
	selectGroupState,
	(stateCompatibility, meterState, groupState) => {
		// The Multiselect's current selected value(s)
		const compatibleSelectedMeters = getSelectOptionsByItem(stateCompatibility.compatibleSelectedMeters, true, meterState)
		const compatibleSelectedGroups = getSelectOptionsByItem(stateCompatibility.compatibleSelectedGroups, true, groupState)

		// The Multiselect's options are grouped as compatible and imcompatible.
		// get pairs
		const currentCompatibleMeters = getSelectOptionsByItem(stateCompatibility.currentCompatibleMeters, true, meterState)
		const currentIncompatibleMeters = getSelectOptionsByItem(stateCompatibility.currentIncompatibleMeters, false, meterState)

		const currentCompatibleGroups = getSelectOptionsByItem(stateCompatibility.currentCompatibleGroups, true, groupState)
		const currentIncompatibleGroups = getSelectOptionsByItem(stateCompatibility.currentIncompatibleGroups, false, groupState)


		const meterGroupedOptions: GroupedOption[] = [
			{
				label: 'Meters',
				options: currentCompatibleMeters
			},
			{
				label: 'Incompatible Meters',
				options: currentIncompatibleMeters
			}
		]
		const groupsGroupedOptions: GroupedOption[] = [
			{
				label: 'Options',
				options: currentCompatibleGroups
			},
			{
				label: 'Incompatible Options',
				options: currentIncompatibleGroups
			}
		]
		console.log('Where Am i Even', meterGroupedOptions, groupsGroupedOptions);
		return { meterGroupedOptions, groupsGroupedOptions, compatibleSelectedMeters, compatibleSelectedGroups }
	}
)

/**
 * Filters all units that are of type meter or displayable type none from the redux state, as well as admin only units if the user is not an admin.
 * @param state - current redux state
 * @returns an array of UnitData
 */
export const selectVisibleUnitOrSuffixState = createSelector(
	selectUnitState,
	selectCurrentUser,
	(unitState, currentUser) => {
		let visibleUnitsOrSuffixes;
		if (currentUser.profile?.role === 'admin') {
			// User is an admin, allow all units to be seen
			visibleUnitsOrSuffixes = _.filter(unitState.units, (o: UnitData) => {
				return (o.typeOfUnit == UnitType.unit || o.typeOfUnit == UnitType.suffix) && o.displayable != DisplayableType.none;
			});
		}
		else {
			// User is not an admin, do not allow for admin units to be seen
			visibleUnitsOrSuffixes = _.filter(unitState.units, (o: UnitData) => {
				return (o.typeOfUnit == UnitType.unit || o.typeOfUnit == UnitType.suffix) && o.displayable == DisplayableType.all;
			});
		}
		return visibleUnitsOrSuffixes;
	}
)

export const selectUnitSelectData = createSelector(
	selectUnitState,
	selectVisibleUnitOrSuffixState,
	selectSelectedMeters,
	selectSelectedGroups,
	selectGraphAreaNormalization,
	(unitState, visibleUnitsOrSuffixes, selectedMeters, selectedGroups, areaNormalization) => {
		// Holds all units that are compatible with selected meters/groups
		const compatibleUnits = new Set<number>();
		// Holds all units that are not compatible with selected meters/groups
		const incompatibleUnits = new Set<number>();

		// Holds all selected meters, including those retrieved from groups
		const allSelectedMeters = new Set<number>();

		// Get for all meters
		selectedMeters.forEach(meter => {
			allSelectedMeters.add(meter);
		});
		// Get for all groups
		selectedGroups.forEach(group => {
			// Get for all deep meters in group
			metersInGroup(group).forEach(meter => {
				allSelectedMeters.add(meter);
			});
		});

		if (allSelectedMeters.size == 0) {
			// No meters/groups are selected. This includes the case where the selectedUnit is -99.
			// Every unit is okay/compatible in this case so skip the work needed below.
			// Filter the units to be displayed by user status and displayable type
			visibleUnitsOrSuffixes.forEach(unit => {
				if (areaNormalization && unit.unitRepresent === UnitRepresentType.raw) {
					incompatibleUnits.add(unit.id);
				} else {
					compatibleUnits.add(unit.id);
				}
			});
		} else {
			// Some meter or group is selected
			// Retrieve set of units compatible with list of selected meters and/or groups
			const units = unitsCompatibleWithMeters(allSelectedMeters);

			// Loop over all units (they must be of type unit or suffix - case 1)
			visibleUnitsOrSuffixes.forEach(o => {
				// Control displayable ones (case 2)
				if (units.has(o.id)) {
					// Should show as compatible (case 3)
					compatibleUnits.add(o.id);
				} else {
					// Should show as incompatible (case 4)
					incompatibleUnits.add(o.id);
				}
			});
		}
		// Ready to display unit. Put selectable ones before non-selectable ones.
		const compatibleUnitsOptions = getSelectOptionsByItem(compatibleUnits, true, unitState);
		const incompatibleUnitsOptions = getSelectOptionsByItem(incompatibleUnits, false, unitState);
		const unitsGroupedOptions: GroupedOption[] = [
			{
				label: 'Units',
				options: compatibleUnitsOptions
			},
			{
				label: 'Incompatible Units',
				options: incompatibleUnitsOptions
			}
		]
		return unitsGroupedOptions
	}
)

export const selectMeterGroupAreaCompatibility = createSelector(
	selectMeterState,
	selectGroupState,
	(meterState, groupState) => {
		// store meters which are found to be incompatible.
		const incompatibleMeters = new Set<number>();
		const incompatibleGroups = new Set<number>();
		const compatibleMeters = new Set<number>();
		const compatibleGroups = new Set<number>();

		Object.values(meterState.byMeterID).forEach(meter => {
			// do not allow meter to be selected if it has zero area or no area unit
			if (meterState.byMeterID[meter.id].area === 0 || meterState.byMeterID[meter.id].areaUnit === AreaUnitType.none) {
				incompatibleMeters.add(meter.id);
			} else {
				compatibleMeters.add(meter.id);
			}
		});

		Object.values(groupState.byGroupID).forEach(group => {
			// do not allow group to be selected if it has zero area or no area unit
			if (groupState.byGroupID[group.id].area === 0 || groupState.byGroupID[group.id].areaUnit === AreaUnitType.none) {
				incompatibleGroups.add(group.id);
			} else {
				compatibleGroups.add(group.id);
			}
		});

		return { compatibleMeters, incompatibleMeters, compatibleGroups, incompatibleGroups }
	}
)
/**
 *  Returns a set of SelectOptions based on the type of state passed in and sets the visibility.
 * Visibility is determined by which set the items are contained in.
 * @param items - items to retrieve select options for
 * @param isCompatible - determines the group option
 * @param state - current redux state, must be one of UnitsState, MetersState, or GroupsState
 * @returns list of selectOptions of the given item
 */
export function getSelectOptionsByItem(items: Set<number>, isCompatible: boolean, state: UnitsState | MetersState | GroupsState) {
	// TODO Refactor origina
	// redefined here for testing.
	// Holds the label of the select item, set dynamically according to the type of item passed in
	let label = '';
	let meterOrGroup: MeterOrGroup | undefined;

	//The final list of select options to be displayed
	const itemOptions: SelectOption[] = [];

	//Loop over each itemId and create an activated select option
	items.forEach(itemId => {
		// Perhaps in the future this can be done differently
		// Loop over the state type to see what state was passed in (units, meter, group, etc)
		// Set the label correctly based on the type of state
		// If this is converted to a switch statement the instanceOf function needs to be called twice
		// Once for the initial state type check, again because the interpreter (for some reason) needs to be sure that the property exists in the object
		// If else statements do not suffer from this
		if (instanceOfUnitsState(state)) {
			label = state.units[itemId].identifier;
		}
		else if (instanceOfMetersState(state)) {
			label = state.byMeterID[itemId].identifier;
			meterOrGroup = MeterOrGroup.meters
		}
		else if (instanceOfGroupsState(state)) {
			label = state.byGroupID[itemId].name;
			meterOrGroup = MeterOrGroup.groups
		}
		else { label = ''; }
		// TODO This is a bit of a hack. When an admin logs in they may not have the new state so label is null.
		// This should clear once the state is loaded.
		label = label === null ? '' : label;
		itemOptions.push({
			value: itemId,
			label: label,
			// If option is compatible then ! not disabled 
			isDisabled: !isCompatible,
			meterOrGroup: meterOrGroup
		} as SelectOption
		);
	});
	const sortedOptions = _.sortBy(itemOptions, item => item.label.toLowerCase(), 'asc')


	return sortedOptions
}
