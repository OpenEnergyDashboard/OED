/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AdminComponent from '../components/AdminComponent';
import { showNotification } from '../actions/notifications';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	return {
		meterID: state.admin.selectedMeter,
	};
}

function mapDispatchToProps(dispatch) {
	return {
		showNotification: notification => dispatch(showNotification(notification))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
