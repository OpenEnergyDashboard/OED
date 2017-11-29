/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import CreateGroupComponent from '../../components/groups/CreateGroupComponent';
import { createNewBlankGroup, editGroupName, changeDisplayMode, DisplayMode, submitGroupInEditingIfNeeded } from '../../actions/groups';
import { Dispatch, State } from '../../types/redux';
import { NamedIDItem } from '../../types/items';

function mapStateToProps(state: State) {
	const sortedMeters: NamedIDItem[] = _.sortBy(_.values(state.meters.byMeterID).map(
		meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedGroups: NamedIDItem[] = _.sortBy(_.values(state.groups.byGroupID).map(
		group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		groups: sortedGroups
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		createNewBlankGroup: () => dispatch(createNewBlankGroup()),
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: (name: string) => dispatch(editGroupName(name)),
		changeDisplayModeToView: () => dispatch(changeDisplayMode(DisplayMode.View))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateGroupComponent);
