/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import GroupsDetailComponent from '../../components/groups/GroupsDetailComponent';
import { State } from '../../types/redux/state';
import {changeDisplayedGroups, fetchGroupsDetailsIfNeeded} from '../../actions/groups';
import {fetchMetersDetailsIfNeeded} from '../../actions/meters';
import {Dispatch} from '../../types/redux/actions';


function mapStateToProps(state: State) {
	const selectGroups = state.groups.selectedGroups;
	return {
		selectedGroups: selectGroups
	};
}
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupsDetailComponent);
