import * as React from 'react';
import * as _ from 'lodash';
import {UnitData} from '../../types/redux/unit'
import UnitsDetailComponent from '../../components/unit/UnitsDetailComponent'
import { connect } from 'react-redux';
import { State } from '../../types/redux/state';
import {Dispatch} from '../../types/redux/actions';
import { unitsApi } from '../../utils/api';
import { fetchUnitsDetails } from 'actions/unit';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';
import { isRoleAdmin } from 'utils/hasPermissions';


function mapStateToProps(state: State, ownProps: { id: number}){  
    let unit = JSON.parse(JSON.stringify(state.units.byUnitID[ownProps.id]));
    if(state.units.editedUnits[ownProps.id]){
        unit = JSON.parse(JSON.stringify(state.units.editedUnits[ownProps.id]))
    }

    const currentUser = state.currentUser.profile;
    let loggedInAsAdmin = false;
    if(currentUser !== null){
        loggedInAsAdmin = isRoleAdmin(currentUser.role);
    }
    return {
        unit,
        isEdited: state.units.editedUnits[ownProps.id] !== undefined,
        loggedInAsAdmin
    };
}

function mapDispatchToProps(dispatch: Dispatch){
    return {
        fetchUnitsDetails: () => dispatch(fetchUnitsDetails())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitsDetailComponent);

// interface UnitDisplayContainerState{
//     units: UnitData[],
//     history: UnitData[][]
// }

// export default class UnitsDetailContainer extends React.Component<{} ,UnitDisplayContainerState> {
//     async componentDidMount() {
//         const units = await this.fetchUnits();
//         this.setState({ units, history: [_.cloneDeep<UnitData[]>(units)]})
//     }

//     state: UnitDisplayContainerState = {
//         units: [],
//         history: []
//     }

//     private async fetchUnits() {
//         return await unitsApi.details();
//     }

//     public render () {
//         return (
//             <div>
//                 <HeaderContainer />
//                 <UnitDetailComponent units={this.state.units} unsavedChanges={false} fetchUnitsDetails={this.fetchUnits}/>
//                 <FooterContainer />
//             </div>
//         )
//     }
// }