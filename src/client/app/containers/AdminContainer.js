/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AdminComponent from '../components/AdminComponent';
import { updateDisplayTitle, updateDefaultGraphType, toggleDefaultBarStacking } from '../actions/admin';
import { showNotification } from '../actions/notifications';

function mapStateToProps(state) {
	return {
		displayTitle: state.admin.displayTitle,
		defaultGraphType: state.admin.defaultGraphType,
		defaultBarStacking: state.admin.defaultBarStacking
	};
}

function mapDispatchToProps(dispatch) {
	return {
		updateDisplayTitle: displayTitle => dispatch(updateDisplayTitle(displayTitle)),
		updateDefaultGraphType: defaultGraphType => dispatch(updateDefaultGraphType(defaultGraphType)),
		toggleDefaultBarStacking: () => dispatch(toggleDefaultBarStacking()),
		showNotification: notification => dispatch(showNotification(notification))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
