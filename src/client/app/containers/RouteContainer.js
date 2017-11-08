/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { clearNotifications } from '../actions/notifications';
import { changeSelectedMeters, changeSelectedGroups, changeBarDuration, changeBarStacking } from '../actions/graph';


function mapStateToProps(state) {
	return {
		notification: state.notifications.notification,
		barStacking: state.graph.barStacking
	};
}

function mapDispatchToProps(dispatch) {
	return {
		clearNotifications: () => dispatch(clearNotifications()),
		changeSelectedMeters: meterIDs => dispatch(changeSelectedMeters(meterIDs)),
		changeSelectedGroups: groupIDs => dispatch(changeSelectedGroups(groupIDs)),
		changeBarDuration: barDuration => dispatch(changeBarDuration(barDuration)),
		changeBarStacking: () => dispatch(changeBarStacking())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
