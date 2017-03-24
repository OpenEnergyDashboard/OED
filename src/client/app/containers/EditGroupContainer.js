/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupComponent from '../components/groups/GroupViewComponent';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDataIfNeeded } from '../actions/groups';
import { changeSelectedMeters, changeSelectedGroups } from '../actions/graph';

/**
 * @param {State} state
 * @return {{meters: *, groups: *, selectedMeters: Array, selectedGroups: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedGroups = _.sortBy(_.values(state.groups).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		groups: sortedGroups,
		selectedMeters: state.graph.selectedMeters,
		selectedGroups: state.graph.selectedGroups
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		selectGroups: newSelectedGroupsIDs => dispatch(changeSelectedGroups(newSelectedGroupsIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		fetchGroupsDataIfNeeded: () => dispatch(fetchGroupsDataIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupComponent);
