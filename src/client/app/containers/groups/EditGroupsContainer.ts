/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupsComponent from '../../components/groups/EditGroupsComponent';
import {
	submitGroupInEditingIfNeeded,
	editGroupName,
	changeDisplayMode,
	changeChildMeters,
	changeChildGroups,
	deleteGroup, fetchGroupsDetailsIfNeeded
} from '../../actions/groups';
import { GroupDefinition, DisplayMode } from '../../types/redux/groups';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import {fetchMetersDetailsIfNeeded} from '../../actions/meters';

/**
 * @param {State} state
 * @return {{meters: *, groups: *}}
 */
function mapStateToProps(state: State) {
	const allMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	let allGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');

	const groupInEditing = state.groups.groupInEditing as GroupDefinition;
	if (groupInEditing === undefined) {
		throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
	}
	allGroups = allGroups.filter(group => group.id !== groupInEditing.id);

	const allMetersExceptChildMeters = allMeters.filter(meter => !_.includes(groupInEditing.childMeters, meter.id));
	const allGroupsExceptChildGroups = allGroups.filter(group => !_.includes(groupInEditing.childGroups, group.id));

	const childMeters = _.sortBy(groupInEditing.childMeters.map((meterID: number) => ({
		name: state.meters.byMeterID[meterID].name.trim(),
		id: meterID
	})), 'name');
	const childGroups = _.sortBy(groupInEditing.childGroups.map((groupID: number) => ({
		name: state.groups.byGroupID[groupID].name.trim(),
		id: groupID
	})), 'name');

	return {
		allMetersExceptChildMeters,
		allGroupsExceptChildGroups,
		childMeters,
		childGroups,
		name: groupInEditing.name
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		deleteGroup: () => dispatch(deleteGroup()),
		editGroupName: (name: string) => dispatch(editGroupName(name)),
		changeChildMeters: (meterIDs: number[]) => dispatch(changeChildMeters(meterIDs)),
		changeChildGroups: (groupIDs: number[]) => dispatch(changeChildGroups(groupIDs))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupsComponent);
