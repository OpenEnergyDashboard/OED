/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MetersDetailComponent from '../../components/meters/MetersDetailComponent';
import { State } from '../../types/redux/state';
import { fetchMetersDetails, submitEditedMeters } from '../../actions/meters';
import {Dispatch} from '../../types/redux/actions';
import { isRoleAdmin } from '../../utils/hasPermissions';
import _ = require('lodash');


function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if(currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		loggedInAsAdmin,
		// The state has all the meter info so map to get the id and identifier then sort that by
		// identifier and finally map so only have id as expected. This causes
		// MetersDetailComponent.tsx to process them in this sorted order
		// and pass them on to MeterViewContainer as desired.
		meters: _.sortBy(_.values(state.meters.byMeterID)
			.map(meter => ({ value: meter.id, label: meter.identifier.trim() })), 'label')
			.map(meter => meter.value),
		unsavedChanges: Object.keys(state.meters.editedMeters).length > 0
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchMetersDetails: () => dispatch(fetchMetersDetails()),
		submitEditedMeters: () => dispatch(submitEditedMeters())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MetersDetailComponent);
