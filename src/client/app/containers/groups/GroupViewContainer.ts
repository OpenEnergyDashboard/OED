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

function mapStateToProps(state: State, ownProps: {id: number}) {
	const id = ownProps.id;
	const childMeterNames = state.groups.byGroupID[id].childMeters.map((meterID: number) => state.meters.byMeterID[meterID].name.trim()).sort();
	const childGroupNames = state.groups.byGroupID[id].childGroups.map((groupID: number) => state.groups.byGroupID[groupID].name.trim()).sort();
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if(currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		id,
		loggedInAsAdmin,
		name: state.groups.byGroupID[id].name,
		childMeterNames,
		childGroupNames
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
