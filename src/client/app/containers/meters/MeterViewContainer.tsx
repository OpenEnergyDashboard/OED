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
import _ = require('lodash');
var indexArray = 0;
function mapStateToProps(state: State, ownProps: { id: number }) {

	const meters = state.meters.byMeterID;
	let sortedMeters = _.sortBy(_.values(meters).map(meter => 
	({ 
		identifier: meter.identifier,
		id: meter.id,
		name: meter.name,
		displayable: meter.displayable,
		enabled: meter.enabled

	})), 'identifier');
	// Algorithm developed to keep sorted Array of meters's index in line with the current passed prop id.
	let i = sortedMeters[ownProps.id - Math.abs(ownProps.id - indexArray)].id;

	let meter = JSON.parse(JSON.stringify(state.meters.byMeterID[i]));
	if (state.meters.editedMeters[ownProps.id]) {
		meter = JSON.parse(JSON.stringify(state.meters.byMeterID[i]));
	}
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	// Keeps track of sortedMeter index. Since page is loaded multiple times resets when count hits the limit.
	// Needs to be visited when meter page is redesigned. 
	if (indexArray != sortedMeters.length - 1){
		indexArray += 1;
	} else { indexArray = 0; }

	return {
		meter,
		isEdited: state.meters.editedMeters[i] !== undefined,
		isSubmitting: state.meters.submitting.indexOf(i) !== -1,
		loggedInAsAdmin,
		sortedMeters
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editMeterDetails: (meter: MeterMetadata) => dispatch(editMeterDetails(meter)),
		log: (level: string, message: string) => dispatch(logToServer(level, message))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterViewComponent);
