/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import GroupViewComponent from '../components/groups/GroupViewComponent';
import { fetchMetersDataIfNeeded } from '../actions/meters';
import { changeSelectedMeters } from '../actions/graph';
import { fetchGroupsDataIfNeeded } from '../actions/groups';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		groups: sortedGroups,
		selectedMeters: state.graph.selectedMeters
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded()),
		fetchGroupsDataIfNeeded: () => dispatch(fetchGroupsDataIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupViewComponent);
