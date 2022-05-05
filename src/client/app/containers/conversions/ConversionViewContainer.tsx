/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { isRoleAdmin } from '../../utils/hasPermissions';
import ConversionViewComponent from '../../components/conversions/ConversionViewComponent';
import { editConversionDetails, removeConversion } from '../../actions/conversions';
import { logToServer } from '../../actions/logs';
import { Conversion } from '../../types/items';

function mapStateToProps(state: State, ownProps: { conversion: Conversion }) {
	let conversion = JSON.parse(JSON.stringify(ownProps.conversion));
	const finder = (element: Conversion) =>
		element.sourceId === ownProps.conversion.sourceId && element.destinationId === ownProps.conversion.destinationId;
	if (state.conversions.editedConversions.length !== 0){
		if (state.conversions.editedConversions.find(finder)) {
			conversion = JSON.parse(JSON.stringify(state.conversions.editedConversions.find(finder)))
		}
	}
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}
	return {
		conversion,
		isEdited: state.conversions.editedConversions.find(finder) !== undefined,
		isSubmitting: state.conversions.submitting.findIndex(finder) !== -1,
		loggedInAsAdmin
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		removeConversion: (conversion: Conversion) => dispatch(removeConversion(conversion)),
		editConversionDetails: (conversion: Conversion) => dispatch(editConversionDetails(conversion)),
		log: (level: string, message: string) => dispatch(logToServer(level,message))
	};
}
export default connect(mapStateToProps,mapDispatchToProps)(ConversionViewComponent);