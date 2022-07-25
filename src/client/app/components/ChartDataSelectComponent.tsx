/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import MultiSelectComponent from './MultiSelectComponent';
import { SelectOption } from '../types/items';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { useSelector, useDispatch } from 'react-redux';
import { State } from '../types/redux/state';
import { ChartTypes } from '../types/redux/graph';
import { DataType } from '../types/Datasources';
import {
	CartesianPoint, Dimensions, normalizeImageDimensions, calculateScaleFromEndpoints,
	itemDisplayableOnMap, itemMapInfoOk, gpsToUserGrid
} from '../utils/calibration';
import {
	changeSelectedGroups, changeSelectedMeters, changeSelectedUnit,updateSelectedMeters,
	updateSelectedGroups, updateSelectedUnit
} from '../actions/graph';
import { DisplayableType, UnitData, UnitType } from '../types/redux/units'
import { metersInGroup, unitsCompatibleWithMeters } from '../utils/determineCompatibleUnits';
import { Dispatch } from '../types/redux/actions';
import { UnitsState } from '../types/redux/units';
import { MetersState } from 'types/redux/meters';
import { GroupsState } from 'types/redux/groups';

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
		const sortedMeters = getMeterCompatibilityForDropdown(state);
		const sortedGroups = getGroupCompatibilityForDropdown(state);
		const sortedUnits = getUnitCompatibilityForDropdown(state);

		//Map information about the currently selected meters into a format the component can display.
		// do extra check for display if using mapChart.
		const disableMeters: number[] = [];
		const disableGroups: number[] = [];

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
						disableMeters.push(meter.value);
					}
				} else {
					// Lack info on this map so skip. This is mostly done since TS complains about the undefined possibility.
					meter.isDisabled = true;
					disableMeters.push(meter.value);
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
						disableGroups.push(group.value);
					}
				} else {
					group.isDisabled = true;
					disableGroups.push(group.value);
				}
			});
		}

		const selectedMeters: SelectOption[] = [];
		state.graph.selectedMeters.forEach(meterID => {
			if (!(disableMeters.includes(meterID))) {
				// If the selected unit is -99 then there is not graphic unit yet. In this case you can only select a
				// meter that has a default graphic unit because that will become the selected unit. This should only
				// happen if no meter or group is yet selected.
				if (state.graph.selectedUnit == -99) {
					// If no unit is set then this should always be the first meter (or group) selected.
					// The selectedUnit becomes the unit of the meter selected. Note is should always be set (not -99) since
					// those meters should not have been visible. The only exception is if there are no selected meters but
					// then this loop does not run. The loop is assumed to only run once in this case.
					// TODO this really should only be for debugging??
					if (state.graph.selectedMeters.length != 1) {
						console.log('9000 state.graph.selectedMeters length is not one but ' + state.graph.selectedMeters.length);
					}

					// TODO is it possible the unit of the meter is not set in state? Seems not if can select??
					//state.graph.selectedUnit = state.meters.byMeterID[meterID].defaultGraphicUnit;
					dispatch(changeSelectedUnit(state.meters.byMeterID[meterID].defaultGraphicUnit));
				}
				selectedMeters.push({
					// For meters we display the identifier.
					label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].identifier : '',
					value: meterID,
					isDisabled: false
				} as SelectOption)
			}
			// 	}
			// }
		});

		const selectedGroups: SelectOption[] = [];
		state.graph.selectedGroups.forEach(groupID => {
			// TODO For now you cannot graph a group unit you have a graphing unit
			// if (!(disableGroups.includes(groupID)) && state.graph.selectedUnit != -99) {
			// TODO use this code once group has default graphic unit
			if (!(disableGroups.includes(groupID))) {
				// If the selected unit is -99 then there is not graphic unit yet. In this case you can only select a
				// group that has a default graphic unit because that will become the selected unit. This should only
				// happen if no meter or group is yet selected.
				if (state.graph.selectedUnit == -99) {
					// If no unit is set then this should always be the first group (or meter) selected.
					// The selectedUnit becomes the unit of the group selected. Note is should always be set (not -99) since
					// those groups should not have been visible. The only exception is if there are no selected groups but
					// then this loop does not run. The loop is assumed to only run once in this case.
					// TODO this really should only be for debugging??
					if (state.graph.selectedGroups.length != 1) {
						console.log('9100 state.graph.selectedGroups length is not one but ' + state.graph.selectedGroups.length);
					}

					// TODO is it possible the unit of the meter is not set in state? Seems not if can select??
					// TODO group state does not yet have default graphic unit so must wait to do this.
					state.graph.selectedUnit = state.groups.byGroupID[groupID].defaultGraphicUnit;
				}
				selectedGroups.push({
					// For groups we display the name since no identifier.
					label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
					value: groupID,
					isDisabled: false
				} as SelectOption);
			}
		});

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

		return {
			sortedMeters,
			sortedGroups,
			sortedUnits,
			selectedMeters,
			selectedGroups,
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
					selectedOptions={dataProps.selectedGroups}
					placeholder={intl.formatMessage(messages.selectGroups)}
					onValuesChange={(newSelectedGroupOptions: SelectOption[]) =>
						dispatch(changeSelectedGroups(newSelectedGroupOptions.map(s => s.value)))}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.groups' />
			</div>
			<p style={labelStyle}>
				<FormattedMessage id='meters' />:
			</p>
			<div style={divBottomPadding}>
				<MultiSelectComponent
					options={dataProps.sortedMeters}
					selectedOptions={dataProps.selectedMeters}
					placeholder={intl.formatMessage(messages.selectMeters)}
					onValuesChange={(newSelectedMeterOptions: SelectOption[]) =>
						dispatch(changeSelectedMeters(newSelectedMeterOptions.map(s => s.value)))}
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
						}
						else if (newSelectedUnitOptions.length === 1) { dispatch(changeSelectedUnit(newSelectedUnitOptions[0].value)); }
						else if (newSelectedUnitOptions.length > 1){ dispatch(changeSelectedUnit(newSelectedUnitOptions[1].value)); }
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
 * @return {SelectOption[]} an array of SelectOption
 */
export function getUnitCompatibilityForDropdown(state: State) {

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
		//Get for all deep meters in group
		metersInGroup(group).forEach(meter => {
			allSelectedMeters.add(meter);
		});
	});

	// If no meters/groups are selected
	if (allSelectedMeters.size == 0) {
		// Every unit is okay/compatible in this case so skip the work needed below.
		// Filter the units to be displayed by user status and displayable type
		getVisibleUnitOrSuffixState(state).forEach(unit => {
			compatibleUnits.add(unit.id);
		});
	// Some meter or group is selected
	} else {
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
	// Ready to display unit. Put selectable ones before unselectable ones.
	const finalUnits = getSelectOptionsByItem(compatibleUnits, incompatibleUnits, state.units);
	return finalUnits;
}

// NOTE: getMeterCompatibilityForDropdown and getGroupCompatibilityForDropdown are essentially the same function.
// Keeping them separate for now for readability, perhaps they can be consolidated in the future

/**
 * Determines the compatibility of meters in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @return {SelectOption[]} an array of SelectOption
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
			if (meter.displayable)
			{
				visibleMeters.add(meter.id);
			}
		});
	}

	// meters that can graph
	const compatibleMeters = new Set<number>();
	// meters that cannot graph.
	const incompatibleMeters = new Set<number>();

	// If no unit is selected
	// In this case, every meter is valid (provided it has a default graphic unit)
	if (state.graph.selectedUnit === -99) {
		// If the meter has a default graphic unit set then it can graph, otherwise it cannot.
		visibleMeters.forEach(meterId => {
			//Default graphic unit is not set
			if (state.meters.byMeterID[meterId].defaultGraphicUnit === -99) {
				incompatibleMeters.add(meterId);
			}
			//Default graphic unit is set
			else {
				compatibleMeters.add(meterId);
			}
		});
	}
	// A unit is selected
	// For each meter get all of its compatible units
	// Then, check if the selected unit exists in that set of compatible units
	else {
		visibleMeters.forEach(meterId => {
			// Get the set of units compatible with the current meter
			const compatibleUnits = unitsCompatibleWithMeters(new Set<number>([meterId]));
			// The selected unit is part of the set of compatible units with this meter
			if (compatibleUnits.has(state.graph.selectedUnit)) {
				compatibleMeters.add(meterId);
			}
			// The selected unit is not part of the compatible units set for this meter
			else {
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
 * @return {SelectOption[]} an array of SelectOption
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
			if (group.displayable)
			{
				visibleGroup.add(group.id);
			}
		});
	}

	// groups that can graph
	const compatibleGroups = new Set<number>();
	// groups that cannot graph.
	const incompatibleGroups = new Set<number>();

	// If no unit is selected
	// In this case, every group is valid (provided it has a default graphic unit)
	if (state.graph.selectedUnit === -99) {
		// If the group has a default graphic unit set then it can graph, otherwise it cannot.
		visibleGroup.forEach(groupId => {
			//Default graphic unit is not set
			if (state.groups.byGroupID[groupId].defaultGraphicUnit === -99) {
				incompatibleGroups.add(groupId);
			}
			//Default graphic unit is set
			else {
				compatibleGroups.add(groupId);
			}
		});
	}
	// A unit is selected
	// For each group get all of its compatible units
	// Then, check if the selected unit exists in that set of compatible units
	else {
		visibleGroup.forEach(groupId => {
			// Get the set of units compatible with the current group (through its deepMeters attribute)
			const compatibleUnits = unitsCompatibleWithMeters(metersInGroup(groupId));
			// The selected unit is part of the set of compatible units with this group
			if (compatibleUnits.has(state.graph.selectedUnit)) {
				compatibleGroups.add(groupId);
			}
			// The selected unit is not part of the compatible units set for this group
			else {
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
 * @return {UnitData[]} an array of UnitData
 */
export function getVisibleUnitOrSuffixState(state: State) {
	let visibleUnitsOrSuffixes;
	// User is an admin, allow all units to be seen
	if (state.currentUser.profile?.role === 'admin') {
		visibleUnitsOrSuffixes = _.filter(state.units.units, (o: UnitData) => {
			return o.typeOfUnit != UnitType.meter && o.displayable != DisplayableType.none;});
	}
	// User is not an admin, do not allow for admin units to be seen
	else {
		visibleUnitsOrSuffixes = _.filter(state.units.units, (o: UnitData) => {
			return o.typeOfUnit != UnitType.meter && o.displayable != DisplayableType.none && o.displayable != DisplayableType.admin;});
	}
	return visibleUnitsOrSuffixes;
}

/**
 *  Returns a set of SelectOptions based on the type of state passed in and sets the visibility.
 * Visibility is determined by which set the items are contained in.
 * @param {State} state - current redux state, must be one of UnitsState, MetersState, or GroupsState
 * @param {Set<number>} compatibleItems - items that are compatible with current selected options
 * @param {Set<number>} incompatibleItems - units that are not compatible with current selected options
 * @return {SelectOption[]} an array of SelectOption
 */
function getSelectOptionsByItem(compatibleItems: Set<number>, incompatibleItems: Set<number>, state: UnitsState | MetersState | GroupsState) {
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
			label = state.byMeterID[itemId].name;
		}
		else if (instanceOfGroupsState(state)) {
			label = state.byGroupID[itemId].name;
		}
		else { label = '';}
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
			label = state.byMeterID[itemId].name;
		}
		else if (instanceOfGroupsState(state)) {
			label = state.byGroupID[itemId].name;
		}
		else { label = '';}
		finalItems.push({
			value: itemId,
			label: label,
			isDisabled: true
		} as SelectOption
		);
	})
	return _.sortBy(_.sortBy(finalItems, item => item.label.toLowerCase(), 'asc'), item => item.isDisabled, 'asc');
}

// Helper functions to determine what type of state was passed in
function instanceOfUnitsState(state: any): state is UnitsState {return 'units' in state;}
function instanceOfMetersState(state: any): state is MetersState {return 'byMeterID' in state;}
function instanceOfGroupsState(state: any): state is GroupsState {return 'byGroupID' in state;}