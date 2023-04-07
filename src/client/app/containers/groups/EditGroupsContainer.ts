/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import EditGroupsComponent from '../../components/groups/EditGroupsComponent';
import {
	submitGroupInEditingIfNeeded,
	editGroupName, editGroupGPS, editGroupDisplayable, editGroupNote, editGroupArea,
	changeChildMeters,
	changeChildGroups,
	changeDisplayMode,
	deleteGroup
} from '../../actions/groups';
import { GroupDefinition, DisplayMode } from '../../types/redux/groups';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import {  browserHistory } from '../../utils/history';
import { GPSPoint } from 'utils/calibration';

/* eslint-disable */

function mapStateToProps(state: State) {
	const allMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	let allGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');

	const groupInEditing = state.groups.groupInEditing as GroupDefinition;
	// If there is no group to edit, then redirect to the view groups page
	if (groupInEditing === undefined || _.isEmpty(_.difference(Object.keys(groupInEditing), ['dirty']))) {
		if (groupInEditing === undefined) {
			throw new Error('Unacceptable condition: state.groups.groupInEditing has no data.');
		}
		if (browserHistory.location.pathname === '/editGroup') {
			// Only redirect to /groups if the user is at /editGroup since the UnsavedWarningComponent has already redirected to other paths
			browserHistory.push('/groups');
		}
		return;
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
		currentGroup: groupInEditing
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		deleteGroup: () => dispatch(deleteGroup()),
		editGroupName: (name: string) => dispatch(editGroupName(name)),
		editGroupGPS: (gps: GPSPoint) => dispatch(editGroupGPS(gps)),
		editGroupDisplayable: (display: boolean) => dispatch(editGroupDisplayable(display)),
		editGroupNote: (note: string) => dispatch(editGroupNote(note)),
		editGroupArea: (area: number) => dispatch(editGroupArea(area)),
		changeDisplayModeToView: () => dispatch(changeDisplayMode(DisplayMode.View)),
		changeChildMeters: (meterIDs: number[]) => dispatch(changeChildMeters(meterIDs)),
		changeChildGroups: (groupIDs: number[]) => dispatch(changeChildGroups(groupIDs))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupsComponent);
