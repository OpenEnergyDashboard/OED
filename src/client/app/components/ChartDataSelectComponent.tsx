/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { GroupsState } from 'types/redux/groups';
import { MetersState } from 'types/redux/meters';
import {
	changeSelectedAreaUnit,
	changeSelectedGroups, changeSelectedMeters, changeSelectedUnit, updateSelectedAreaUnit, updateSelectedGroups,
	updateSelectedMeters, updateSelectedUnit
} from '../actions/graph';
import { DataType } from '../types/Datasources';
import { SelectOption } from '../types/items';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes } from '../types/redux/graph';
import { State } from '../types/redux/state';
import { DisplayableType, UnitData, UnitsState, UnitType } from '../types/redux/units';
import {
	calculateScaleFromEndpoints, CartesianPoint, Dimensions, gpsToUserGrid,
	itemDisplayableOnMap, itemMapInfoOk, normalizeImageDimensions
} from '../utils/calibration';
import { metersInGroup, unitsCompatibleWithMeters } from '../utils/determineCompatibleUnits';
import MultiSelectComponent from './MultiSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * A component which allows the user to select which data should be displayed on the chart.
 */
export default function ChartDataSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};
	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};
	const messages = defineMessages({
		selectGroups: { id: 'select.groups' },
		selectMeters: { id: 'select.meters' },
		selectUnit: { id: 'select.unit' },
		helpSelectGroups: { id: 'help.home.select.groups' },
		helpSelectMeters: { id: 'help.home.select.meters' }
	});

	const intl = useIntl();

	const dataProps = useSelector((state: State) => {
		const allMeters = state.meters.byMeterID;
		const allGroups = state.groups.byGroupID;

		// Map information about meters, groups and units into a format the component can display.
		let sortedMeters = getMeterCompatibilityForDropdown(state);
		let sortedGroups = getGroupCompatibilityForDropdown(state);
		const sortedUnits = getUnitCompatibilityForDropdown(state);

		const nonAreaMeters: number[] = [];
		const nonAreaGroups: number[] = [];

		// only run this check if area normalization is on
		if(state.graph.areaNormalization) {
			sortedMeters.forEach(meter => {
				// do not allow meter to be selected if it does not have area
				if(allMeters[meter.value].area === 0 || allMeters[meter.value].area === null) {
					meter.isDisabled = true;
					nonAreaMeters.push(meter.value);
				}
			});
			sortedGroups.forEach(group => {
				// do not allow group to be selected if it does not have area
				if(allGroups[group.value].area === 0 || allGroups[group.value].area === null) {
					group.isDisabled = true;
					nonAreaGroups.push(group.value);
				}
			});
		}

		//Map information about the currently selected meters into a format the component can display.
		// do extra check for display if using mapChart.
		const nonGpsMeters: number[] = [];
		const nonGpsGroups: number[] = [];

		// Don't do this if there is no selected map.
		const chartToRender = state.graph.chartToRender;
		const selectedMap = state.maps.selectedMap;
		if (chartToRender === ChartTypes.map && selectedMap !== 0) {
			const mp = state.maps.byMapID[selectedMap];
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
			sortedMeters.forEach(meter => {
				// This meter's GPS value.
				const gps = allMeters[meter.value].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
					// (or really any two distinct points) you can calculate this by the change in GPS over the
					// change in x or y which is the map's width & height in this case.
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					// Convert GPS of meter to grid on user map. See calibration.ts for more info on this.
					const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(meter.value, DataType.Meter, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid))) {
						meter.isDisabled = true;
						nonGpsMeters.push(meter.value);
					}
				} else {
					// Lack info on this map so skip. This is mostly done since TS complains about the undefined possibility.
					meter.isDisabled = true;
					nonGpsMeters.push(meter.value);
				}
			});
			// The below code follows the logic for meters shown above. See comments above for clarification on the below code.
			sortedGroups.forEach(group => {
				const gps = allGroups[group.value].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					const groupGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(group.value, DataType.Group, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, groupGPSInUserGrid))) {
						group.isDisabled = true;
						nonGpsGroups.push(group.value);
					}
				} else {
					group.isDisabled = true;
					nonGpsGroups.push(group.value);
				}
			});
		}

		const compatibleSelectedMeters: SelectOption[] = [];
		const allSelectedMeters: SelectOption[] = [];
		state.graph.selectedMeters.forEach(meterID => {
			allSelectedMeters.push({
				// For meters we display the identifier.
				label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].identifier : '',
				value: meterID,
				isDisabled: false
			} as SelectOption)
			// don't include meters that can't be graphed with current settings
			if (!(nonGpsMeters.includes(meterID)) && !(nonAreaMeters.includes(meterID))) {
				// If the selected unit is -99 then there is not graphic unit yet. In this case you can only select a
				// meter that has a default graphic unit because that will become the selected unit. This should only
				// happen if no meter or group is yet selected.
				if (state.graph.selectedUnit == -99) {
					// If no unit is set then this should always be the first meter (or group) selected.
					// The selectedUnit becomes the unit of the meter selected. Note is should always be set (not -99) since
					// those meters should not have been visible. The only exception is if there are no selected meters but
					// then this loop does not run. The loop is assumed to only run once in this case.
					dispatch(changeSelectedUnit(state.meters.byMeterID[meterID].defaultGraphicUnit));
				}
				// update area unit in a similar fashion
				// if(state.graph.areaNormalization && state.graph.selectedAreaUnit == -99) {
				// 	dispatch(changeSelectedAreaUnit(state.meters.byMeterID[meterID].areaUnitId));
				// }
				compatibleSelectedMeters.push({
					// For meters we display the identifier.
					label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].identifier : '',
					value: meterID,
					isDisabled: false
				} as SelectOption)
			}
		});

		// re-sort by disabled because that status may have changed (mainly for maps)
		sortedMeters = _.sortBy(sortedMeters, item => item.isDisabled, 'asc');
		// push a dummy item as a divider.
		const firstDisabledMeter: number = sortedMeters.findIndex(item => item.isDisabled);
		if (firstDisabledMeter != -1) {
			sortedMeters.splice(firstDisabledMeter, 0, {
				value: 0,
				label: '----- Incompatible Meters -----',
				isDisabled: true
			} as SelectOption
			);
		}

		const compatibleSelectedGroups: SelectOption[] = [];
		const allSelectedGroups: SelectOption[] = [];
		state.graph.selectedGroups.forEach(groupID => {
			allSelectedGroups.push({
				// For groups we display the name since no identifier.
				label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
				value: groupID,
				isDisabled: false
			} as SelectOption);
			// don't include groups that can't be graphed with current settings
			if (!(nonGpsGroups.includes(groupID)) && !(nonAreaGroups.includes(groupID))) {
				// If the selected unit is -99 then there is no graphic unit yet. In this case you can only select a
				// group that has a default graphic unit because that will become the selected unit. This should only
				// happen if no meter or group is yet selected.
				if (state.graph.selectedUnit == -99) {
					// If no unit is set then this should always be the first group (or meter) selected.
					// The selectedUnit becomes the unit of the group selected. Note is should always be set (not -99) since
					// those groups should not have been visible. The only exception is if there are no selected groups but
					// then this loop does not run. The loop is assumed to only run once in this case.
					state.graph.selectedUnit = state.groups.byGroupID[groupID].defaultGraphicUnit;
				}
				compatibleSelectedGroups.push({
					// For groups we display the name since no identifier.
					label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
					value: groupID,
					isDisabled: false
				} as SelectOption);
			}
		});

		// re-sort by disabled because that status may have changed (mainly for maps)
		sortedGroups = _.sortBy(sortedGroups, item => item.isDisabled, 'asc');
		// dummy item as a divider
		const firstDisabledGroup: number = sortedGroups.findIndex(item => item.isDisabled);
		if (firstDisabledGroup != -1) {
			sortedGroups.splice(firstDisabledGroup, 0, {
				value: 0,
				label: '----- Incompatible Groups -----',
				isDisabled: true
			} as SelectOption
			);
		}

		// You can only select one unit so variable name is singular.
		// This does not need to be an array but we make it one for now so works similarly to meters & groups.
		// TODO Might want to make it work as a single item.
		const selectedUnit: SelectOption[] = [];
		[state.graph.selectedUnit].forEach(unitID => {
			if (unitID !== -99) {
				// Only use if valid/selected unit which means it is not -99.
				selectedUnit.push({
					// Units use the identifier to display.
					label: state.graph.selectedUnit ? state.units.units[state.graph.selectedUnit].identifier : '',
					value: unitID,
					isDisabled: false
				} as SelectOption);
			}
		});

		// push a dummy item as a divider.
		const firstDisabledUnit: number = sortedUnits.findIndex(item => item.isDisabled);
		if (firstDisabledUnit != -1) {
			sortedUnits.splice(firstDisabledUnit, 0, {
				value: 0,
				label: '----- Incompatible Units -----',
				isDisabled: true
			} as SelectOption
			);
		}

		return {
			// all items, sorted alphabetically and by compatibility
			sortedMeters,
			sortedGroups,
			sortedUnits,
			// only selected items which are compatible with the current graph type
			compatibleSelectedMeters,
			compatibleSelectedGroups,
			// all selected items regardless of compatibility
			allSelectedMeters,
			allSelectedGroups,
			// currently selected unit
			selectedUnit
		}
	});

	// Must specify type if using ThunkDispatch
	const dispatch: Dispatch = useDispatch();

	return (
		<div>
			<p style={labelStyle}>
				<FormattedMessage id='groups' />:
			</p>
			<div style={divBottomPadding}>
				<MultiSelectComponent
					options={dataProps.sortedGroups}
					selectedOptions={dataProps.compatibleSelectedGroups}
					placeholder={intl.formatMessage(messages.selectGroups)}
					onValuesChange={(newSelectedGroupOptions: SelectOption[]) => {
						// see meters code below for comments, as the code functions the same
						const allSelectedGroupIDs: number[] = dataProps.allSelectedGroups.map(s => s.value);
						const oldSelectedGroupIDs: number[] = dataProps.compatibleSelectedGroups.map(s => s.value);
						const newSelectedGroupIDs: number[] = newSelectedGroupOptions.map(s => s.value);
						const difference: number = oldSelectedGroupIDs.filter(x => !newSelectedGroupIDs.includes(x))[0];
						if (difference === undefined) {
							allSelectedGroupIDs.push(newSelectedGroupIDs.filter(x => !oldSelectedGroupIDs.includes(x))[0]);
						} else {
							allSelectedGroupIDs.splice(allSelectedGroupIDs.indexOf(difference), 1);
						}
						dispatch(changeSelectedGroups(allSelectedGroupIDs));
					}}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.groups' />
			</div>
			<p style={labelStyle}>
				<FormattedMessage id='meters' />:
			</p>
			<div style={divBottomPadding}>
				<MultiSelectComponent
					options={dataProps.sortedMeters}
					selectedOptions={dataProps.compatibleSelectedMeters}
					placeholder={intl.formatMessage(messages.selectMeters)}
					onValuesChange={(newSelectedMeterOptions: SelectOption[]) => {
						//computes difference between previously selected meters and current selected meters,
						// then makes the change to all selected meters, which includes incompatible selected meters
						const allSelectedMeterIDs: number[] = dataProps.allSelectedMeters.map(s => s.value);
						const oldSelectedMeterIDs: number[] = dataProps.compatibleSelectedMeters.map(s => s.value);
						const newSelectedMeterIDs: number[] = newSelectedMeterOptions.map(s => s.value);
						// It is assumed there can only be one element in this array, because this is triggered every time the selection is changed
						// first filter finds items in the old list than are not in the new (deletions)
						const difference: number = oldSelectedMeterIDs.filter(x => !newSelectedMeterIDs.includes(x))[0];
						if (difference === undefined) {
							// finds items in the new list which are not in the old list (insertions)
							allSelectedMeterIDs.push(newSelectedMeterIDs.filter(x => !oldSelectedMeterIDs.includes(x))[0]);
						} else {
							allSelectedMeterIDs.splice(allSelectedMeterIDs.indexOf(difference), 1);
						}
						dispatch(changeSelectedMeters(allSelectedMeterIDs));
					}}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.meters' />
			</div>
			<p style={labelStyle}>
				<FormattedMessage id='units' />:
			</p>
			<div style={divBottomPadding}>
				<MultiSelectComponent
					options={dataProps.sortedUnits}
					selectedOptions={dataProps.selectedUnit}
					placeholder={intl.formatMessage(messages.selectUnit)}
					onValuesChange={(newSelectedUnitOptions: SelectOption[]) => {
						// TODO I don't quite understand why the component results in an array of size 2 when updating state
						// For now I have hardcoded a fix that allows units to be selected over other units without clicking the x button
						if (newSelectedUnitOptions.length === 0) {
							// Update the selected meters and groups to empty to avoid graphing errors
							// The update selected meters/groups functions are essentially the same as the change functions
							// However, they do not attempt to graph.
							dispatch(updateSelectedGroups([]));
							dispatch(updateSelectedMeters([]));
							dispatch(updateSelectedUnit(-99));
							dispatch(updateSelectedAreaUnit(-99));
						}
						else if (newSelectedUnitOptions.length === 1) { dispatch(changeSelectedUnit(newSelectedUnitOptions[0].value)); }
						else if (newSelectedUnitOptions.length > 1) { dispatch(changeSelectedUnit(newSelectedUnitOptions[1].value)); }
						// This should not happen
						else { dispatch(changeSelectedUnit(-99)); }
					}}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.units' />
			</div>
		</div>
	);
}

/**
 * Determines the compatibility of units in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @returns {SelectOption[]} an array of SelectOption
 */
function getUnitCompatibilityForDropdown(state: State) {

	// Holds all units that are compatible with selected meters/groups
	const compatibleUnits = new Set<number>();
	// Holds all units that are not compatible with selected meters/groups
	const incompatibleUnits = new Set<number>();

	// Holds all selected meters, including those retrieved from groups
	const allSelectedMeters = new Set<number>();

	// Get for all meters
	state.graph.selectedMeters.forEach(meter => {
		allSelectedMeters.add(meter);
	});
	// Get for all groups
	state.graph.selectedGroups.forEach(group => {
		// Get for all deep meters in group
		metersInGroup(group).forEach(meter => {
			allSelectedMeters.add(meter);
		});
	});

	if (allSelectedMeters.size == 0) {
		// No meters/groups are selected. This includes the case where the selectedUnit is -99.
		// Every unit is okay/compatible in this case so skip the work needed below.
		// Filter the units to be displayed by user status and displayable type
		getVisibleUnitOrSuffixState(state).forEach(unit => {
			compatibleUnits.add(unit.id);
		});
	} else {
		// Some meter or group is selected
		// Retrieve set of units compatible with list of selected meters and/or groups
		const units = unitsCompatibleWithMeters(allSelectedMeters);

		// Loop over all units (they must be of type unit or suffix - case 1)
		getVisibleUnitOrSuffixState(state).forEach(o => {
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
	const finalUnits = getSelectOptionsByItem(compatibleUnits, incompatibleUnits, state.units);
	return finalUnits;
}

// NOTE: getMeterCompatibilityForDropdown and getGroupCompatibilityForDropdown are essentially the same function.
// Keeping them separate for now for readability, perhaps they can be consolidated in the future

/**
 * Determines the compatibility of meters in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @returns {SelectOption[]} an array of SelectOption
 */
export function getMeterCompatibilityForDropdown(state: State) {
	// Holds all meters visible to the user
	const visibleMeters = new Set<number>();

	// Get all the meters that this user can see.
	if (state.currentUser.profile?.role === 'admin') {
		// Can see all meters
		Object.values(state.meters.byMeterID).forEach(meter => {
			visibleMeters.add(meter.id);
		});
	}
	else {
		// Regular user or not logged in so only add displayable meters
		Object.values(state.meters.byMeterID).forEach(meter => {
			if (meter.displayable) {
				visibleMeters.add(meter.id);
			}
		});
	}

	// meters that can graph
	const compatibleMeters = new Set<number>();
	// meters that cannot graph.
	const incompatibleMeters = new Set<number>();

	if (state.graph.selectedUnit === -99) {
		// No unit is selected then no meter/group should be selected.
		// In this case, every meter is valid (provided it has a default graphic unit)
		// If the meter has a default graphic unit set then it can graph, otherwise it cannot.
		visibleMeters.forEach(meterId => {
			if (state.meters.byMeterID[meterId].defaultGraphicUnit === -99) {
				//Default graphic unit is not set
				incompatibleMeters.add(meterId);
			}
			else {
				//Default graphic unit is set
				compatibleMeters.add(meterId);
			}
		});
	}
	else {
		// A unit is selected
		// For each meter get all of its compatible units
		// Then, check if the selected unit exists in that set of compatible units
		visibleMeters.forEach(meterId => {
			// Get the set of units compatible with the current meter
			const compatibleUnits = unitsCompatibleWithMeters(new Set<number>([meterId]));
			if (compatibleUnits.has(state.graph.selectedUnit)) {
				// The selected unit is part of the set of compatible units with this meter
				compatibleMeters.add(meterId);
			}
			else {
				// The selected unit is not part of the compatible units set for this meter
				incompatibleMeters.add(meterId);
			}
		});
	}

	// Retrieve select options from meter sets
	const finalMeters = getSelectOptionsByItem(compatibleMeters, incompatibleMeters, state.meters);
	return finalMeters;
}

/**
 * Determines the compatibility of group in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @returns {SelectOption[]} an array of SelectOption
 */
export function getGroupCompatibilityForDropdown(state: State) {
	// Holds all groups visible to the user
	const visibleGroup = new Set<number>();

	// Get all the groups that this user can see.
	if (state.currentUser.profile?.role === 'admin') {
		// Can see all groups
		Object.values(state.groups.byGroupID).forEach(group => {
			visibleGroup.add(group.id);
		});
	}
	else {
		// Regular user or not logged in so only add displayable groups
		Object.values(state.groups.byGroupID).forEach(group => {
			if (group.displayable) {
				visibleGroup.add(group.id);
			}
		});
	}

	// groups that can graph
	const compatibleGroups = new Set<number>();
	// groups that cannot graph.
	const incompatibleGroups = new Set<number>();

	if (state.graph.selectedUnit === -99) {
		// If no unit is selected then no meter/group should be selected.
		// In this case, every group is valid (provided it has a default graphic unit)
		// If the group has a default graphic unit set then it can graph, otherwise it cannot.
		visibleGroup.forEach(groupId => {
			if (state.groups.byGroupID[groupId].defaultGraphicUnit === -99) {
				//Default graphic unit is not set
				incompatibleGroups.add(groupId);
			}
			else {
				//Default graphic unit is set
				compatibleGroups.add(groupId);
			}
		});
	}
	else {
		// A unit is selected
		// For each group get all of its compatible units
		// Then, check if the selected unit exists in that set of compatible units
		visibleGroup.forEach(groupId => {
			// Get the set of units compatible with the current group (through its deepMeters attribute)
			// TODO If a meter in a group is not visible to this user then it is not in Redux state and this fails.
			const compatibleUnits = unitsCompatibleWithMeters(metersInGroup(groupId));
			if (compatibleUnits.has(state.graph.selectedUnit)) {
				// The selected unit is part of the set of compatible units with this group
				compatibleGroups.add(groupId);
			}
			else {
				// The selected unit is not part of the compatible units set for this group
				incompatibleGroups.add(groupId);
			}
		});
	}

	// Retrieve select options from group sets
	const finalGroups = getSelectOptionsByItem(compatibleGroups, incompatibleGroups, state.groups);
	return finalGroups;
}

/**
 * Filters all units that are of type meter or displayable type none from the redux state, as well as admin only units if the user is not an admin.
 * @param {State} state - current redux state
 * @returns {UnitData[]} an array of UnitData
 */
export function getVisibleUnitOrSuffixState(state: State) {
	let visibleUnitsOrSuffixes;
	if (state.currentUser.profile?.role === 'admin') {
		// User is an admin, allow all units to be seen
		visibleUnitsOrSuffixes = _.filter(state.units.units, (o: UnitData) => {
			return (o.typeOfUnit == UnitType.unit || o.typeOfUnit == UnitType.suffix) && o.displayable != DisplayableType.none;
		});
	}
	else {
		// User is not an admin, do not allow for admin units to be seen
		visibleUnitsOrSuffixes = _.filter(state.units.units, (o: UnitData) => {
			return (o.typeOfUnit == UnitType.unit || o.typeOfUnit == UnitType.suffix) && o.displayable == DisplayableType.all;
		});
	}
	return visibleUnitsOrSuffixes;
}

/**
 *  Returns a set of SelectOptions based on the type of state passed in and sets the visibility.
 * Visibility is determined by which set the items are contained in.
 * @param {Set<number>} compatibleItems - items that are compatible with current selected options
 * @param {Set<number>} incompatibleItems - units that are not compatible with current selected options
 * @param {UnitsState | MetersState | GroupsState} state - current redux state, must be one of UnitsState, MetersState, or GroupsState
 * @returns {SelectOption[]} an array of SelectOption
 */
export function getSelectOptionsByItem(compatibleItems: Set<number>, incompatibleItems: Set<number>, state: UnitsState | MetersState | GroupsState) {
	// Holds the label of the select item, set dynamically according to the type of item passed in
	let label = '';

	//The final list of select options to be displayed
	const finalItems: SelectOption[] = [];

	//Loop over each itemId and create an activated select option
	compatibleItems.forEach(itemId => {
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
		}
		else if (instanceOfGroupsState(state)) {
			label = state.byGroupID[itemId].name;
		}
		else { label = ''; }
		// TODO This is a bit of a hack. When an admin logs in they may not have the new state so label is null.
		// This should clear once the state is loaded.
		label = label === null ? '' : label;
		finalItems.push({
			value: itemId,
			label: label,
			isDisabled: false
		} as SelectOption
		);
	});
	//Loop over each itemId and create a disabled select option
	incompatibleItems.forEach(itemId => {
		if (instanceOfUnitsState(state)) {
			label = state.units[itemId].identifier;
		}
		else if (instanceOfMetersState(state)) {
			label = state.byMeterID[itemId].identifier;
		}
		else if (instanceOfGroupsState(state)) {
			label = state.byGroupID[itemId].name;
		}
		else { label = ''; }
		// TODO This is a bit of a hack. When an admin logs in they may not have the new state so label is null.
		// This should clear once the state is loaded.
		label = label === null ? '' : label;
		finalItems.push({
			value: itemId,
			label: label,
			isDisabled: true
		} as SelectOption
		);
	})
	return _.sortBy(_.sortBy(finalItems, item => item.label.toLowerCase(), 'asc'), item => item.isDisabled, 'asc');
}

/**
 * Helper function to determine what type of state was passed in
 * @param {*} state The state to check
 * @returns {boolean} Whether or not this is a UnitsState
 */
function instanceOfUnitsState(state: any): state is UnitsState { return 'units' in state; }
/**
 * Helper function to determine what type of state was passed in
 * @param {*} state The state to check
 * @returns {boolean} Whether or not this is a MetersState
 */
function instanceOfMetersState(state: any): state is MetersState { return 'byMeterID' in state; }
/**
 * Helper function to determine what type of state was passed in
 * @param {*} state The state to check
 * @returns {boolean} Whether or not this is a GroupsState
 */
function instanceOfGroupsState(state: any): state is GroupsState { return 'byGroupID' in state; }
