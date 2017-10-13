/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupsComponent from '../../components/groups/EditGroupsComponent';
import { submitGroupInEditingIfNeeded, editGroupName, changeDisplayMode, DISPLAY_MODE, changeChildMeters, changeChildGroups, deleteGroup } from '../../actions/groups';

/**
 * @param {State} state
 * @return {{meters: *, groups: *}}
 */
function mapStateToProps(state) {
	const allMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	let allGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	allGroups = allGroups.filter(group => group.id !== state.groups.groupInEditing.id);

	const allMetersExceptChildMeters = allMeters.filter(meter => !_.includes(state.groups.groupInEditing.childMeters, meter.id));
	const allGroupsExceptChildGroups = allGroups.filter(group => !_.includes(state.groups.groupInEditing.childGroups, group.id));

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
		deleteGroup: () => dispatch(deleteGroup()),
		editGroupName: name => dispatch(editGroupName(name)),
		changeDisplayModeToView: () => dispatch(changeDisplayMode(DISPLAY_MODE.VIEW)),
		changeChildMeters: meterIDs => dispatch(changeChildMeters(meterIDs)),
		changeChildGroups: groupIDs => dispatch(changeChildGroups(groupIDs))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupsComponent);
