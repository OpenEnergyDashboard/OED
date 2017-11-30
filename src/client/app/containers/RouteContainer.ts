/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { clearNotifications } from '../actions/notifications';
import { Dispatch, State } from '../types/redux';
import { changeOptionsFromLink, LinkOptions } from '../actions/graph';


function mapStateToProps(state: State) {
	return {
		notification: state.notifications.notification,
		barStacking: state.graph.barStacking
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		clearNotifications: () => dispatch(clearNotifications()),
		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
