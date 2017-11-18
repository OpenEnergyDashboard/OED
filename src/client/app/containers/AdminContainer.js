/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AdminComponent from '../components/AdminComponent';
import { updateSelectedMeter } from '../actions/admin';
import { showNotification } from '../actions/notifications';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ value: meter.id, label: meter.name.trim() })), 'name'),
		selectedImportMeterID: state.admin.selectedMeter,
	};
}

function mapDispatchToProps(dispatch) {
	return {
		showNotification: notification => dispatch(showNotification(notification)),
		updateSelectedImportMeter: meterID => dispatch(updateSelectedMeter(meterID))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
