/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import CreateGroupComponent from '../../components/groups/CreateGroupComponent';
import {
	createNewBlankGroup, editGroupName, changeDisplayMode, submitGroupInEditingIfNeeded,
	fetchGroupsDetailsIfNeeded
} from '../../actions/groups';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import { NamedIDItem } from '../../types/items';
import { DisplayMode } from '../../types/redux/groups';
import {fetchMetersDetailsIfNeeded} from '../../actions/meters';

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
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
		createNewBlankGroup: () => dispatch(createNewBlankGroup()),
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: (name: string) => dispatch(editGroupName(name)),
		changeDisplayModeToView: () => dispatch(changeDisplayMode(DisplayMode.View))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateGroupComponent);
