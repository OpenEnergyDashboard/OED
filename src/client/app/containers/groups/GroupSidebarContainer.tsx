/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { changeDisplayedGroups } from '../../actions/groups';
import GroupSidebarComponent from '../../components/groups/GroupSidebarComponent';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';

function mapStateToProps(state: State) {
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		groups: sortedGroups,
		loggedInAsAdmin
	};
}


function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectGroups: (newSelectedGroupIDs: number[]) => dispatch(changeDisplayedGroups(newSelectedGroupIDs))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSidebarComponent);
