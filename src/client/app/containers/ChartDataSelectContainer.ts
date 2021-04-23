/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import ChartDataSelectComponent from '../components/ChartDataSelectComponent';
import { changeSelectedGroups, changeSelectedMeters } from '../actions/graph';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { ChartTypes } from '../types/redux/graph';
import { SelectOption } from '../types/items';
import { CartesianPoint, Dimensions, normalizeImageDimensions, calculateScaleFromEndpoints, meterDisplayableOnMap, meterMapInfoOk } from '../utils/calibration';
import { gpsToUserGrid } from './../utils/calibration';


/* Passes the current redux state of the chart select container, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the selected and sorted object. */
function mapStateToProps(state: State) {
	// Map information about meters and groups into a format the component can display.
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter =>
		({ value: meter.id, label: meter.name.trim(), disabled: false } as SelectOption)), 'label');
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group =>
		({ value: group.id, label: group.name.trim(), disabled: false } as SelectOption)), 'label');

	/**
	 * 	Map information about the currently selected meters into a format the component can display.
	 */
	// do extra check for display if using mapChart.
	const disableMeters: number[] = [];
	// Don't do this if there is no selected map.
	if (state.graph.chartToRender === ChartTypes.map && state.maps.selectedMap !== 0) {
		// filter meters;
		const image = state.maps.byMapID[state.maps.selectedMap].image;
		// The size of the original map loaded into OED.
		const imageDimensions: Dimensions = {
			width: image.width,
			height: image.height
		};
		// Determine the dimensions so within the Plotly coordinates on the user map.
		const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
		sortedMeters.forEach(meter => {
			// This meter's GPS value.
			const gps = state.meters.byMeterID[meter.value].gps;
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
			const origin = state.maps.byMapID[state.maps.selectedMap].origin;
			const opposite = state.maps.byMapID[state.maps.selectedMap].opposite;
			// The gps value can be null from the database. Note using gps !== null to check for both null and undefined
			// causes TS to complain about the unknown case so not used.
			if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
				// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
				// (or really any two distinct points) you can calculate this by the change in GPS over the
				// change in x or y which is the map's width & height in this case.
				const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized);
				// Convert GPS of meter to grid on user map. See calibration.ts for more info on this.
				const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap);
				if (!(meterMapInfoOk({ gps, meterID: meter.value }, state.maps.byMapID[state.maps.selectedMap]) &&
					meterDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid))) {
					meter.disabled = true;
					disableMeters.push(meter.value);
				}
			} else {
				// Lack info on this map so skip. This is mostly done since TS complains about the undefined possibility.
				meter.disabled = true;
				disableMeters.push(meter.value);
			}
		});
		// filter groups - this is not yet done as groups do not show up on maps yet.
	}

	const selectedGroups = state.graph.selectedGroups.map(groupID => (
		{
			label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
			value: groupID,
			disabled: false
		} as SelectOption
	));
	const selectedMeters = state.graph.selectedMeters.map(meterID => {
		if (disableMeters.includes(meterID)) {
			return;
		} else {
			return {
				label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].name : '',
				value: meterID,
				disabled: false
			} as SelectOption
		}
	});

	return {
		meters: sortedMeters,
		groups: sortedGroups,
		selectedMeters,
		selectedGroups
	};
}

// function to dispatch selected meter information
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectMeters: (newSelectedMeterIDs: number[]) => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		selectGroups: (newSelectedGroupIDs: number[]) => dispatch(changeSelectedGroups(newSelectedGroupIDs))
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps, mapDispatchToProps)(ChartDataSelectComponent);
