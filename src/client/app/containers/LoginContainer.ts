/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { Notification } from 'react-notification-system';
import LoginComponent from '../components/LoginComponent';
import { showNotification } from '../actions/notifications';
import { Dispatch } from '../types/redux/actions';

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		showNotification: (notification: Notification) => dispatch(showNotification(notification))
	};
}

export default connect(null, mapDispatchToProps)(LoginComponent);
