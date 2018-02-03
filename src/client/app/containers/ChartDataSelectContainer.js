/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import ChartDataSelectComponent from '../components/ChartDataSelectComponent';
import { changeSelectedMeters, changeSelectedGroups } from '../actions/graph';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';


/**
 * @param {State} state
 */
function mapStateToProps(state) {
	// Map information about meters and groups into a format the component can display.
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ value: meter.id, label: meter.name.trim() })), 'name');
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ value: group.id, label: group.name.trim() })), 'name');

	// Map information about the currently selected meters into a format the component can display.
	const selectedGroups = state.graph.selectedGroups.map(groupID => (
		{
			label: state.groups.byGroupID[groupID] ? state.groups.byGroupID[groupID].name : '',
			value: groupID
		}
	));
	const selectedMeters = state.graph.selectedMeters.map(meterID => (
		{
			label: state.meters.byMeterID[meterID] ? state.meters.byMeterID[meterID].name : '',
			value: meterID
		}
	));
	return {
		meters: sortedMeters,
		groups: sortedGroups,
		selectedMeters: selectedMeters,
		selectedGroups: selectedGroups
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		selectGroups: newSelectedGroupIDs => dispatch(changeSelectedGroups(newSelectedGroupIDs)),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
	};
}

/**
 * Connects changes to the Redux store to ChartSelectComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(ChartDataSelectComponent);
