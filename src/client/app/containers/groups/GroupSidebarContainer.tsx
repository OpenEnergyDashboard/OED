/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { changeDisplayedGroups, changeDisplayMode, DisplayMode } from '../../actions/groups';
import GroupSidebarComponent from '../../components/groups/GroupSidebarComponent';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';

function mapStateToProps(state: State) {
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		groups: sortedGroups
	};
}


function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectGroups: (newSelectedGroupIDs: number[]) => dispatch(changeDisplayedGroups(newSelectedGroupIDs)),
		changeDisplayModeToCreate: () => dispatch(changeDisplayMode(DisplayMode.Create))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSidebarComponent);
