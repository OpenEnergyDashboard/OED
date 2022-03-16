import * as React from 'react';
import {State} from '../../types/redux/state';
import UnitViewComponent from '../../components/unit/UnitViewComponent';
import {Dispatch} from '../../types/redux/actions';
import { connect } from 'react-redux';
import { logToServer } from '../../actions/logs';
import { UnitMetadata } from 'types/redux/unit';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { UnitData } from '../../types/redux/unit';
import { editUnitDetails } from '../../actions/unit';

function mapStateToProps(state: State, ownProps: {id: number}){
    let unit = JSON.parse(JSON.stringify(state.units.byUnitID[ownProps.id]));
    if(state.units.editedUnits[ownProps.id]){
        unit = JSON.parse(JSON.stringify(state.units.editedUnits[ownProps.id]));
    }

    const currentUser = state.currentUser.profile;
	let loggedInAsAdmin = false;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
	}

    return{
        unit,
        isEdited: state.units.editedUnits[ownProps.id] !== undefined,
        isSubmitting: state.units.submitting.indexOf(ownProps.id) !== -1,
		loggedInAsAdmin
    }
}
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editUnitDetails: (unit: UnitData) => dispatch(editUnitDetails(unit)),
		log: (level: string, message: string) => dispatch(logToServer(level, message))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitViewComponent);