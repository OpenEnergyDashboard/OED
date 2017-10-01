/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupsComponent from '../../components/groups/EditGroupsComponent';
import { submitGroupInEditingIfNeeded, editGroupName, changeDisplayMode, changeChildMeters, changeChildGroups } from '../../actions/groups';

/**
 * @param {State} state
 * @return {{meters: *, groups: *}}
 */
function mapStateToProps(state) {
	const allMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const allGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');

	const allMetersExceptChildMeters = allMeters.filter(meter => _.includes(state.groups.groupInEditing.childMeters, meter.id));
	const allGroupsExceptChildGroups = allGroups.filter(group => _.includes(state.groups.groupInEditing.childGroups, group.id));

	const childMeters = _.sortBy(state.groups.groupInEditing.childMeters.map(meterID => ({
		name: state.meters.byMeterID[meterID].name.trim(),
		id: meterID
	})), 'name');
	const childGroups = _.sortBy(state.groups.groupInEditing.childGroups.map(groupID => ({
		name: state.groups.byGroupID[groupID].name.trim(),
		id: groupID
	})), 'name');

	return {
		allMetersExceptChildMeters,
		allGroupsExceptChildGroups,
		childMeters,
		childGroups,
		name: state.groups.groupInEditing.name
	};
}

function mapDispatchToProps(dispatch) {
	return {
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: name => dispatch(editGroupName(name)),
		changeDisplayMode: newMode => dispatch(changeDisplayMode(newMode)),
		changeChildMeters: meterIDs => dispatch(changeChildMeters(meterIDs)),
		changeChildGroups: groupIDs => dispatch(changeChildGroups(groupIDs))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupsComponent);
