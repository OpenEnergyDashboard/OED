/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MetersDetailComponent from '../../components/meters/MetersDetailComponent';
import { State } from '../../types/redux/state';
import { fetchMetersDetails, submitEditedMeters } from '../../actions/meters';
import {Dispatch} from '../../types/redux/actions';
import { isRoleAdmin } from '../../utils/hasPermissions';


function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if(currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

	return {
		loggedInAsAdmin,
		meters: Object.keys(state.meters.byMeterID)
			.map(key => parseInt(key))
			.filter(key => !isNaN(key)),
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
