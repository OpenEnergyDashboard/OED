/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import _ from 'lodash';
import { connect } from 'react-redux';
import CreateGroupComponent from '../../components/groups/CreateGroupComponent';
import { createNewBlankGroup, editGroupName, changeDisplayMode, submitGroupInEditingIfNeeded } from '../../actions/groups';

function mapStateToProps(state) {
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID).map(group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		groups: sortedGroups
	};
}

function mapDispatchToProps(dispatch) {
	return {
		createNewBlankGroup: () => dispatch(createNewBlankGroup()),
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: name => dispatch(editGroupName(name)),
		changeDisplayMode: newMode => dispatch(changeDisplayMode(newMode))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateGroupComponent);
