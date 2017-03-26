/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import { connect } from 'react-redux';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { fetchGroupsDetailsIfNeeded } from '../actions/groups';
import GroupMainComponent from '../components/groups/GroupMainComponent';


function mapStateToProps(state) {
	const sortedGroups = _.sortBy(_.values(state.groups.byGroupID), 'name');
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		groups: sortedGroups,
		meters: sortedMeters
	};
}


function mapDispatchToProps(dispatch) {
	return {
		fetchGroupsDetailsIfNeeded: () => dispatch(fetchGroupsDetailsIfNeeded()),
		fetchMetersDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded()),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupMainComponent);
