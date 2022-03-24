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
//change global var to local; problem we have is indexArray wont increment from MapstatetoProps.
//var indexArray = 0;

function mapStateToProps(state: State, ownProps: { id: number }) {
	//const meters = state.meters.byMeterID;
	//var sortedMeters = _.sortBy(_.values(meters).map(meter => 
	//({ 
	//	identifier: meter.identifier,
	//	id: meter.id,
	//	name: meter.name,
	//	displayable: meter.displayable,
	//	enabled: meter.enabled,
	//	meterType: meter.meterType
    //
	//})), 'identifier');
	// i is to convert the displayable prop.id to a index in the sorted array. For example 7 is passed, 7 - (7 - 0) = index 0, and so on.
	// this results in a 0,1,2,3,4... to index into the sorted array and retrieve the meter.id to pass on.
	//let i = sortedMeters[ownProps.id - Math.abs(ownProps.id - indexArray)].id;
	
	let meter = JSON.parse(JSON.stringify(state.meters.byMeterID[ownProps.id]));
	if (state.meters.editedMeters[ownProps.id]) {
		meter = JSON.parse(JSON.stringify(state.meters.byMeterID[ownProps.id]));
	}
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	// Keeps track of sortedMeter index. Since page is loaded multiple times resets when count hits the limit.
	// Needs to be visited when meter page is redesigned. 
	//if (indexArray != sortedMeters.length - 1) {
	//	indexArray += 1;
	//} else { indexArray = 0; }

	return {
		meter,
		isEdited: state.meters.editedMeters[ownProps.id] !== undefined,
		isSubmitting: state.meters.submitting.indexOf(ownProps.id) !== -1,
		loggedInAsAdmin,
		//sortedMeters
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editMeterDetails: (meter: MeterMetadata) => dispatch(editMeterDetails(meter)),
		log: (level: string, message: string) => dispatch(logToServer(level, message))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterViewComponent);
