/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import CreateGroupComponent from '../../components/groups/CreateGroupComponent';
import { createNewBlankGroup, editGroupName, editGroupGPS,
	editGroupDisplayable, editGroupNote, editGroupArea, submitGroupInEditingIfNeeded,
	changeDisplayMode } from '../../actions/groups';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import { NamedIDItem } from '../../types/items';
import { DisplayMode } from '../../types/redux/groups';
import { GPSPoint } from 'utils/calibration';

/* eslint-disable */

function mapStateToProps(state: State) {
	const sortedMeters: NamedIDItem[] = _.sortBy(_.values(state.meters.byMeterID).map(
		meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedGroups: NamedIDItem[] = _.sortBy(_.values(state.groups.byGroupID).map(
		group => ({ id: group.id, name: group.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		groups: sortedGroups,
		currentGroup: state.groups.groupInEditing
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		createNewBlankGroup: () => dispatch(createNewBlankGroup()),
		submitGroupInEditingIfNeeded: () => dispatch(submitGroupInEditingIfNeeded()),
		editGroupName: (name: string) => dispatch(editGroupName(name)),
		editGroupGPS: (gps: GPSPoint) => dispatch(editGroupGPS(gps)),
		editGroupDisplayable: (display: boolean) => dispatch(editGroupDisplayable(display)),
		editGroupNote: (note: string) => dispatch(editGroupNote(note)),
		editGroupArea: (area: number) => dispatch(editGroupArea(area)),
		changeDisplayModeToView: () => dispatch(changeDisplayMode(DisplayMode.View))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateGroupComponent);
