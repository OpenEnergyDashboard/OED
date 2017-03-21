/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import EditGroupComponent from '../components/groups/GroupViewComponent';
import { fetchMetersDataIfNeeded } from '../actions/meters';
import { changeSelectedMeters } from '../actions/graph';
/**
 * @param {State} state
 * @return {}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters,
		selectedGroups: state.graph.selectedGroups
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		selectGroups: newSelectedGroupsIDs => dispatch(),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupComponent);
