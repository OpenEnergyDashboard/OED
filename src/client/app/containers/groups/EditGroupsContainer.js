/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupsComponent from '../../components/groups/EditGroupsComponent';
import { submitGroupInEditingIfNeeded, editGroupName, changeDisplayMode } from '../../actions/groups';

/**
 * @param {State} state
 * @return {{meters: *, groups: *}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		groups: sortedGroups,
		id: state.groups.groupInEditing.id,
		name: state.groups.groupInEditing.name
	};
}

function mapDispatchToProps(dispatch) {
	return {
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: name => dispatch(editGroupName(name)),
		changeDisplayMode: newMode => dispatch(changeDisplayMode(newMode))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupsComponent);
