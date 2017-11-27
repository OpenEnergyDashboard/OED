/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { showNotification } from '../actions/notifications';
import { changeOptionsFromLink } from '../actions/graph';


function mapStateToProps(state) {
	return {
		notification: state.notifications.notification,
		barStacking: state.graph.barStacking
	};
}

function mapDispatchToProps(dispatch) {
	return {
		showNotification: notification => dispatch(showNotification(notification)),
		changeOptionsFromLink: options => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
