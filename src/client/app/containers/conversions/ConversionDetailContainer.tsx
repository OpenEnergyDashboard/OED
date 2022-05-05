/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { isRoleAdmin } from '../../utils/hasPermissions';
import ConversionDetailComponent from '../../components/conversions/ConversionDetailComponent';
import { createConversion, fetchConversionDetails, submitConversionsEdits, deleteConversion } from '../../actions/conversions';
import { Conversion } from '../../types/items';


function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin =  false;
	if (currentUser !== null){
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		loggedInAsAdmin,
		conversions: state.conversions.conversion,
		unsavedChanges: state.conversions.editedConversions.length > 0
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		createConversion: (sourceId: number,
			destinationId: number,
			bidirectional: boolean,
			slope: number,
			intercept: number,
			note: string) => dispatch(createConversion(
			sourceId,
			destinationId,
			bidirectional,
			slope,
			intercept,
			note)),
		deleteConversion: (conversion: Conversion) => dispatch(deleteConversion(conversion)),
		fetchConversionDetails: () => dispatch(fetchConversionDetails()),
		submitConversionsEdits: () => dispatch(submitConversionsEdits())
	};
}
export default connect(mapStateToProps,mapDispatchToProps)(ConversionDetailComponent);