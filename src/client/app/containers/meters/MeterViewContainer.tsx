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
	//first index of ownProps.id - first displayable id 
	let meter = JSON.parse(JSON.stringify(sortedMeters[ownProps.id - 7]));
	if (state.meters.editedMeters[ownProps.id]) {
		meter = JSON.parse(JSON.stringify(sortedMeters[ownProps.id - 7]));
	}
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	if (indexArray != sortedMeters.length){
		indexArray += 1;
	}
	// math.abs()
	console.log(indexArray);
	return {
		meter,
		isEdited: state.meters.editedMeters[ownProps.id] !== undefined,
		isSubmitting: state.meters.submitting.indexOf(ownProps.id) !== -1,
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
