/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */
import _ from 'lodash';
import { connect } from 'react-redux';
import { fetchMetersDetailsIfNeeded } from '../../actions/meters';
import { fetchGroupsDetailsIfNeeded, switchSelectedGroups } from '../../actions/groups';
import GroupSidebarComponent from '../../components/groups/GroupSidebarComponent';


function mapStateToProps(state) {
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		groups: sortedGroups,
		selectedGroups: state.groups.selectedGroups
	};
}


function mapDispatchToProps(dispatch) {
	return {
		selectGroups: newSelectedGroupIDs => dispatch(switchSelectedGroups(newSelectedGroupIDs)),
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSidebarComponent);
