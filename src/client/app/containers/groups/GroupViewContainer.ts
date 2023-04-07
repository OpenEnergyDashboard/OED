/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import GroupViewComponent from '../../components/groups/GroupViewComponent';
import { fetchGroupChildrenIfNeeded, beginEditingIfPossible, changeDisplayMode } from '../../actions/groups';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import { DisplayMode } from '../../types/redux/groups';
import { isRoleAdmin } from '../../utils/hasPermissions';

/* eslint-disable */

function mapStateToProps(state: State, ownProps: { id: number }) {
	const id = ownProps.id;
	const childMeterNames: string[] = [];
	state.groups.byGroupID[id].childMeters.forEach((meterID: number) => {
		// See below with same logic for why.
		if (state.meters.byMeterID[meterID] !== undefined && state.meters.byMeterID[meterID].identifier !== null) {
			childMeterNames.push(state.meters.byMeterID[meterID].identifier.trim());
		}
	});
	childMeterNames.sort();
	const trueMeterSize = state.groups.byGroupID[id].childMeters.length;
	const childGroupNames: string[] = [];
	state.groups.byGroupID[id].childGroups.forEach((groupID: number) => {
		if (state.groups.byGroupID[groupID] !== undefined) {
			childGroupNames.push(state.groups.byGroupID[groupID].name.trim());
		}
	});
	childGroupNames.sort();
	const trueGroupSize = state.groups.byGroupID[id].childGroups.length;
	const deepMeterNames: string[] = [];
	state.groups.byGroupID[id].deepMeters.forEach((meterID: number) => {
		// TODO We need a more general fix for hidden groups and meters but waiting until the major changes for units is done.
		// Meter state should no longer be undefined but leaving for now.
		// Also must check for null name since we do that for non-admin. Same above.
		if (state.meters.byMeterID[meterID] !== undefined && state.meters.byMeterID[meterID].identifier !== null) {
			deepMeterNames.push(state.meters.byMeterID[meterID].identifier.trim());
		}
	});
	deepMeterNames.sort();
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

	return {
		id,
		loggedInAsAdmin,
		name: state.groups.byGroupID[id].name,
		childMeterNames,
		childGroupNames,
		deepMeterNames,
		trueMeterSize,
		trueGroupSize
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchGroupChildren: (id: number) => dispatch(fetchGroupChildrenIfNeeded(id)),
		changeDisplayModeToEdit: () => dispatch(changeDisplayMode(DisplayMode.Edit)),
		beginEditingIfPossible: (id: number) => dispatch(beginEditingIfPossible(id))

	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupViewComponent);
