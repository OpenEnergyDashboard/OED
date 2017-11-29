/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import GroupViewComponent from '../../components/groups/GroupViewComponent';
import { fetchGroupChildrenIfNeeded, changeDisplayMode, beginEditingIfPossible, DisplayMode } from '../../actions/groups';
import { Dispatch, State } from '../../types/redux';


/**
 * Pass the ID and Name of the group on to the component.
 * @param {State} state
 * @param ownProps: ID and Name, passed to this container by GroupMainComponent
 * @return {{name: name of this group}, {id: id of this group}}
 */
function mapStateToProps(state: State, ownProps: {id: number}) {
	const id = ownProps.id;
	const childMeterNames = state.groups.byGroupID[id].childMeters.map(meterID => state.meters.byMeterID[meterID].name.trim()).sort();
	const childGroupNames = state.groups.byGroupID[id].childGroups.map(groupID => state.groups.byGroupID[groupID].name.trim()).sort();
	return {
		id,
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
