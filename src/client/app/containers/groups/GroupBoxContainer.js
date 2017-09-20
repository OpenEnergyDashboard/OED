/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import { connect } from 'react-redux';
import GroupBoxComponent from '../../components/groups/GroupBoxComponent';
import { changeSelectedGroupsOfGroup, changeChildGroups } from '../../actions/groups';

function mapStateToProps(state, ownProps) {
	let groups = null;
	if (ownProps.groupID) {
		groups = state.groups.byGroupID[ownProps.parentID].childGroups.map(groupID => {
			const group = state.groups.byGroupID[groupID];
			return {
				id: group.id,
				name: group.name,
			};
		});
	} else {
		groups = Object.keys(state.groups.byGroupID).map(groupID => {
			const group = state.groups.byGroupID[groupID];
			return {
				id: group.id,
				name: group.name
			};
		});
	}

	return { groups };
}

function mapDispatchToProps(dispatch, ownProps) {
	if (ownProps.parentID) {
		return {
			selectGroups: groupIDs => dispatch(changeSelectedGroupsOfGroup(ownProps.parentID, groupIDs))
		};
	}
	return {
		selectGroups: groupIDs => dispatch(changeChildGroups(groupIDs)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupBoxComponent);
