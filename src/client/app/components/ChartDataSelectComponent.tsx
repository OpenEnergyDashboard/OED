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
import { changeSelectedGroups, changeSelectedMeters, changeSelectedUnit } from '../actions/graph';
import { DisplayableType, UnitData, UnitType } from '../types/redux/units'
import { metersInGroup, setIntersect, unitsCompatibleWithMeters } from '../utils/determineCompatibleUnits';
import { Dispatch } from '../types/redux/actions';

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
		const sortedMeters = _.sortBy(_.values(allMeters).map(meter =>
			({ value: meter.id, label: meter.name.trim(), isDisabled: false } as SelectOption)), 'label');
		const sortedGroups = _.sortBy(_.values(allGroups).map(group =>
			({ value: group.id, label: group.name.trim(), isDisabled: false } as SelectOption)), 'label');
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
				// TODO: this logic seems wrong as it stops valid meters from being included. Also, maybe it should be elsewhere for allowed meters to consider???
				// if (state.graph.selectedUnit == -99) {
				// 	if (state.meters.byMeterID[meterID] && state.meters.byMeterID[meterID].defaultGraphicUnit == -99) {
				if (state.graph.selectedUnit == -99) {
					// If no unit is set then this should always be the first meter selected.
					// The selectedUnit becomes the unit of the meter selected. Note is should always be set (not -99) since
					// those meters should not have been visible. The only exception is if there are no selected meters but
					// then this loop does not run. The loop is assumed to only run once in this case.
					// TODO this really should only be for debugging
					if (state.graph.selectedMeters.length != 1) {
						console.log('9000 state.graph.selectedMeters is not one but ' + state.graph.selectedMeters.length);
					}

					// TODO is it possible the unit of the meter is not set in state? Seems not if can select??
					// TODO ???? the unit should be the unit not the meter id
					state.graph.selectedUnit = state.meters.byMeterID[meterID].defaultGraphicUnit;
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
			if (!(disableGroups.includes(groupID))) {
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
				selectedUnit.push({
					// TODO check out if this is correct/best way???
					// Units use the identifier to display.
					label: state.graph.selectedUnit ? state.units.units[state.graph.selectedUnit].identifier : '',
					value: unitID,
					isDisabled: false
				} as SelectOption);
			}
		});
		// TODO Remove???
		// const selectedUnit = {
		// label: state.units.units[state.graph.selectedUnit] ? state.units.units[state.graph.selectedUnit].name : '',
		// 		value: state.graph.selectedUnit,
		// 			isDisabled: false
		// } as SelectOption

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
						let newUnit;
						if (newSelectedUnitOptions.length === 0) {
							// The unit was unselected so no new one. Thus, set to -99 since no unit.
							// TODO This causes an error by trying to get data before the value is changed again.??????
							// TODO need to clear all meters/groups in this case.
							// TODO nice if warned user about to clear all meters/groups.
							newUnit = -99;
						} else {
							newUnit = newSelectedUnitOptions[0].value;
						}
						dispatch(changeSelectedUnit(newUnit));
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
	if (state.graph.selectedUnit === -99) {
		// Every unit is okay/compatible in this case so skip the work needed below.
		// Can only show unit types (not meters) and only displayable ones.
		// <current user type> is either all (not logged in as admin) or admin
		getVisibleUnitOrSuffixState(state).forEach(unit => {
			compatibleUnits.add(unit.id);
		})
	} else {
		// Some meter or group is selected
		// Holds the units compatible with the meters/groups selected.
		// The first meter or group processed is different since intersection with empty set is empty.
		let first = true;
		let units = new Set<number>();
		const M = new Set<number>();
		// Get for all meters
		state.graph.selectedMeters.forEach(meter => {
			M.add(meter);
			const newUnits = unitsCompatibleWithMeters(M)
			if (first) {
				// First meter/group so all its units are acceptable at this point
				units = newUnits;
				first = false;
			} else {
				// Do intersection of compatible units so far with ones for this meters
				units = setIntersect(units, newUnits);
			}
		})
		// Get for all groups
		state.graph.selectedGroups.forEach(async group => {
			const newUnits = unitsCompatibleWithMeters(await metersInGroup(group));
			if (first) {
				// First meter/group so all its units are acceptable at this point
				units = newUnits;
				first = false;
			} else {
				// Do intersection of compatible units so far with ones for this meters
				units = setIntersect(newUnits, units);
			}
		})
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
		})
	}
	// Ready to display unit. Put selectable ones before unselectable ones.
	const finalUnits = getUnitCompatibility(compatibleUnits, incompatibleUnits, state);
	return finalUnits;
}

/**
 * Filters all units that are of type meter or displayable type none from the redux state.
 * @param {State} state - current redux state
 * @return {UnitData[]} an array of UnitData
 */
export function getVisibleUnitOrSuffixState(state: State) {
	const visibleUnitsOrSuffixes = _.filter(state.units.units, function (o: UnitData) {
		return o.typeOfUnit != UnitType.meter && o.displayable != DisplayableType.none;
	})
	return visibleUnitsOrSuffixes;
}

/**
 *  Sets visibility of SelectOptions for dropdown. Determined by which set they are contained in
 * @param {State} state - current redux state
 * @param {Set<number>} compatibleUnits - units that are compatible with current selected unit
 * @param {Set<number>} incompatibleUnits - units that are not compatible with current selected unit
 * @return {SelectOption[]} an array of SelectOption
 */
function getUnitCompatibility(compatibleUnits: Set<number>, incompatibleUnits: Set<number>, state: State) {
	const finalUnits: SelectOption[] = [];
	compatibleUnits.forEach(unit => {
		finalUnits.push({
			value: unit,
			label: state.units.units[unit].identifier,
			isDisabled: false
		} as SelectOption
		)
	})
	incompatibleUnits.forEach(unit => {
		finalUnits.push({
			value: unit,
			label: state.units.units[unit].identifier,
			isDisabled: true
		} as SelectOption
		)
	})
	return _.sortBy(_.sortBy(finalUnits, unit => unit.label.toLowerCase(), 'asc'), unit => unit.isDisabled, 'asc');
}
// }