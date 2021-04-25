/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MeterViewComponent from '../../components/meters/MeterViewComponent';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';
import { editMeterDetails } from '../../actions/meters';
import { MeterMetadata } from '../../types/redux/meters';
import { logToServer } from '../../actions/logs';
import { isRoleAdmin } from '../../utils/hasPermissions';

function mapStateToProps(state: State, ownProps: { id: number }) {
	let meter = JSON.parse(JSON.stringify(state.meters.byMeterID[ownProps.id]));
	if (state.meters.editedMeters[ownProps.id]) {
		meter = JSON.parse(JSON.stringify(state.meters.editedMeters[ownProps.id]));
	}

	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		meter,
		isEdited: state.meters.editedMeters[ownProps.id] !== undefined,
		isSubmitting: state.meters.submitting.indexOf(ownProps.id) !== -1,
		loggedInAsAdmin
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editMeterDetails: (meter: MeterMetadata) => dispatch(editMeterDetails(meter)),
		log: (level: string, message: string) => dispatch(logToServer(level, message))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterViewComponent);
