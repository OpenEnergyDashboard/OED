/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import GroupViewComponent from '../../components/groups/GroupViewComponent';
import { fetchGroupChildrenIfNeeded, changeDisplayMode, beginEditingIfPossible, DISPLAY_MODE } from '../../actions/groups';


/**
 * Pass the ID and Name of the group on to the component.
 * @param {State} state
 * @param ownProps: ID and Name, passed to this container by GroupMainComponent
 * @return {{name: name of this group}, {id: id of this group}}
 */
function mapStateToProps(state, ownProps) {
	const id = ownProps.id;
	const childMeters = state.groups.byGroupID[id].childMeters.map(meterID => state.meters.byMeterID[meterID].name.trim()).sort();
	const childGroups = state.groups.byGroupID[id].childGroups.map(groupID => state.groups.byGroupID[groupID].name.trim()).sort();
	return {
		id,
		name: state.groups.byGroupID[id].name,
		childMeters,
		childGroups
	};
}

function mapDispatchToProps(dispatch) {
	return {
		fetchGroupChildren: id => dispatch(fetchGroupChildrenIfNeeded(id)),
		changeDisplayModeToEdit: () => dispatch(changeDisplayMode(DISPLAY_MODE.EDIT)),
		beginEditingIfPossible: id => dispatch(beginEditingIfPossible(id))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupViewComponent);
