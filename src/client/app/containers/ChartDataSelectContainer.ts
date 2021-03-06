/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import {connect} from 'react-redux';
import ChartDataSelectComponent from '../components/ChartDataSelectComponent';
import {changeSelectedGroups, changeSelectedMeters} from '../actions/graph';
import {State} from '../types/redux/state';
import {Dispatch} from '../types/redux/actions';
import {ChartTypes} from '../types/redux/graph';
import {SelectOption} from '../types/items';
import {meterDisplayableOnMap} from '../utils/calibration';


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
	// do extra check for display if using mapChart;
	const disableMeters: number[] = [];
	if (state.graph.chartToRender === ChartTypes.map) {
		// filter meters;
		sortedMeters.forEach(meter => {
			const gps = state.meters.byMeterID[meter.value].gps;
			if (!meterDisplayableOnMap({gps, meterID: meter.value}, state.maps.byMapID[state.maps.selectedMap])) {
				meter.disabled = true;
				disableMeters.push(meter.value);
			}
		});
		// filter groups;
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
