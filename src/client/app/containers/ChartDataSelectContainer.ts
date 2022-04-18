/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import ChartDataSelectComponent from '../components/ChartDataSelectComponent';
import { changeSelectedGroups, changeSelectedMeters, changeSelectedUnit } from '../actions/graph';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes } from '../types/redux/graph';
import { SelectOption } from '../types/items';
import {
	CartesianPoint, Dimensions, normalizeImageDimensions, calculateScaleFromEndpoints,
	itemDisplayableOnMap, itemMapInfoOk
} from '../utils/calibration';
import { gpsToUserGrid } from './../utils/calibration';
import { DisplayableType, UnitData, UnitType } from '../types/redux/units'
import { metersInGroup, setIntersect, unitsCompatibleWithMeters } from '../utils/determineCompatibleUnits';
import { DataType } from '../types/Datasources';


/* Passes the current redux state of the chart select container, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the selected and sorted object. */
function mapStateToProps(state: State) {
	// Map information about meters and groups into a format the component can display.
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter =>
		({ value: meter.id, label: meter.name.trim(), isDisabled: false } as SelectOption)), 'label');
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group =>
		({ value: group.id, label: group.name.trim(), isDisabled: false } as SelectOption)), 'label');
	const sortedUnits = getUnitCompatibilityForDropdown(state);
	/**
	 * 	Map information about the currently selected meters into a format the component can display.
	 */
	// do extra check for display if using mapChart.
	const disableMeters: number[] = [];
	const disableGroups: number[] = [];
	// Don't do this if there is no selected map.
	if (state.graph.chartToRender === ChartTypes.map && state.maps.selectedMap !== 0) {
		const mp = state.maps.byMapID[state.maps.selectedMap];
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
			const gps = state.meters.byMeterID[meter.value].gps;
			if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
				// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
				// (or really any two distinct points) you can calculate this by the change in GPS over the
				// change in x or y which is the map's width & height in this case.
				const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
				// Convert GPS of meter to grid on user map. See calibration.ts for more info on this.
				const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
				if (!(itemMapInfoOk(meter.value, DataType.Meter, state.maps.byMapID[state.maps.selectedMap], gps) &&
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
			const gps = state.groups.byGroupID[group.value].gps;
			if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
				const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
				const groupGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
				if (!(itemMapInfoOk(group.value, DataType.Group, state.maps.byMapID[state.maps.selectedMap], gps) &&
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

	const selectedMeters = state.graph.selectedMeters.map(meterID => {
		if (disableMeters.includes(meterID)) {
			return;
		} else {
			return {
				label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].name : '',
				value: meterID,
				isDisabled: false
			} as SelectOption
		}
	});

	const selectedGroups = state.graph.selectedGroups.map(groupID => {
		if (disableGroups.includes(groupID)) {
			return;
		}
		else {
			return {
				label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
				value: groupID,
				isDisabled: false
			} as SelectOption
		}
	});

	const selectedUnit = {
		label: state.units.units[state.graph.selectedUnit] ? state.units.units[state.graph.selectedUnit].name : '',
		value: state.graph.selectedUnit,
		isDisabled: false
	} as SelectOption

	return {
		meters: sortedMeters,
		groups: sortedGroups,
		units: sortedUnits,
		selectedMeters,
		selectedGroups,
		selectedUnit
	};
}

// function to dispatch selected meter information
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectMeters: (newSelectedMeterIDs: number[]) => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		selectGroups: (newSelectedGroupIDs: number[]) => dispatch(changeSelectedGroups(newSelectedGroupIDs)),
		selectUnit: (newSelectUnitID: number) => dispatch(changeSelectedUnit(newSelectUnitID))
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps, mapDispatchToProps)(ChartDataSelectComponent);

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

		state.graph.selectedMeters.forEach(meter => {
			M.add(meter);
		})
		// Get for all meters
		M.forEach( () => {

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
		getVisibleUnitOrSuffixState(state).forEach(o => {
			if (units.has(o.id)) {
				compatibleUnits.add(o.id);
			} else {
				incompatibleUnits.add(o.id);
			}
		})
	}
	const finalUnits = getUnitCompatibility(compatibleUnits, incompatibleUnits, state);
	return finalUnits;
}

/**
 * Creates an array from the state filled with all units that are not meter or not displayable
 * @param {State} state - current redux state
 * @return {UnitData[]} an array of UnitData
 */
export function getVisibleUnitOrSuffixState(state: State) {
	const visibleUnitsOrSuffixs = _.filter(state.units.units, function (o: UnitData) {
		return o.typeOfUnit != UnitType.meter && o.displayable != DisplayableType.none;
	})
	return visibleUnitsOrSuffixs;
}

/**
 * Converts two sets of unitIDs into one sorted array of SelectOptions for the dropdown
 * @param {State} state - current redux state
 * @param {Set<number>} compatibleUnits - units that are compatible with current selected unit
 * @param {Set<number>} incompatibleUnits - units that are not compatible with current selected unit
 * @return {SelectOption[]} an array of SelectOption
 */
export function getUnitCompatibility(compatibleUnits: Set<number>, incompatibleUnits: Set<number>, state: State) {
	const finalUnits: SelectOption[] = [];
	compatibleUnits.forEach(unit => {
		finalUnits.push({
			label: state.units.units[unit].identifier,
			value: unit,
			isDisabled: false
		} as SelectOption
		)
	})


	incompatibleUnits.forEach(unit => {
		finalUnits.push({
			label: state.units.units[unit].identifier,
			value: unit,
			isDisabled: true
		} as SelectOption
		)
	})


	return _.orderBy(finalUnits, ['isDisabled', 'label'], ['asc', 'asc']);
}