import * as _ from 'lodash';
import UnitsDetailComponent from '../../components/unit/UnitsDetailComponent'
import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import {Dispatch} from '../../types/redux/actions';
import { fetchUnitsDetails, submitEditedUnits} from '../../actions/units';
import { isRoleAdmin } from '../../utils/hasPermissions';


function mapStateToProps(state: State){ 
    const currentUser = state.currentUser.profile;
    let loggedInAsAdmin = false;
    if(currentUser !== null){
        loggedInAsAdmin = isRoleAdmin(currentUser.role);
    }

    return {
        loggedInAsAdmin, 
		units: Object.keys(state.units.byUnitID)
			.map(key => parseInt(key))
			.filter(key => !isNaN(key)),
		unsavedChanges: Object.keys(state.units.editedUnits).length > 0
    };
}

function mapDispatchToProps(dispatch: Dispatch){
    return {
        fetchUnitsDetails: () => dispatch(fetchUnitsDetails()),
        submitEditedUnits: () => dispatch(submitEditedUnits())
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitsDetailComponent);