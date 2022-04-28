/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import UnitsDetailComponent from '../../components/unit/UnitsDetailComponent'
import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { fetchUnitsDetails, submitEditedUnits } from '../../actions/units';
import { isRoleAdmin } from '../../utils/hasPermissions';


function mapStateToProps(state: State) {
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

	return {
		loggedInAsAdmin,
		units: Object.keys(state.units.units)
			.map(key => parseInt(key))
			.filter(key => !isNaN(key)),
		unsavedChanges: Object.keys(state.units.editedUnits).length > 0
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchUnitsDetails: () => dispatch(fetchUnitsDetails()),
		submitEditedUnits: () => dispatch(submitEditedUnits())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitsDetailComponent);
