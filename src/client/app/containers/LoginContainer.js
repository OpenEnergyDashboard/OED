/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import LoginComponent from '../components/LoginComponent';
import { sendNotification } from '../actions/topLevel';

function mapDispatchToProps(dispatch) {
	return {
		sendNotification: notification => dispatch(sendNotification(notification))
	};
}

export default connect(null, mapDispatchToProps)(LoginComponent);
