/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { State } from '../../types/redux/state';
import UnitViewComponent from '../../components/unit/UnitViewComponent';
import { Dispatch } from '../../types/redux/actions';
import { connect } from 'react-redux';
import { logToServer } from '../../actions/logs';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/units';
import { editUnitDetails } from '../../actions/units';

function mapStateToProps(state: State, ownProps: { id: number }) {
	let unit = JSON.parse(JSON.stringify(state.units.units[ownProps.id])); //grab unitData from passed unitId props
	if (state.units.editedUnits[ownProps.id]) { //replace unitData with edited unitData if there were any unsubmitted edits
		unit = JSON.parse(JSON.stringify(state.units.editedUnits[ownProps.id]));
	}

	//admin check moved to child
	const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

	return {
		unit,
		isEdited: state.units.editedUnits[ownProps.id] !== undefined, //not used?
		isSubmitting: state.units.submitting.indexOf(ownProps.id) !== -1, //not used?
		loggedInAsAdmin 
	}
}
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editUnitDetails: (unit: UnitData) => dispatch(editUnitDetails(unit)), //can move this to child
		log: (level: string, message: string) => dispatch(logToServer(level, message)) //can move this to child, but not used?
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitViewComponent);
