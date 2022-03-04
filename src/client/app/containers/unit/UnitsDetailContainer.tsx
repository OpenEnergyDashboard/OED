import * as React from 'react';
import * as _ from 'lodash';
import {UnitData} from '../../types/redux/unit'
import UnitDetailComponent from '../../components/unit/UnitsDetailComponent'
import { unitsApi } from '../../utils/api';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';


// function mapStateToProps(state: State){  
//     return {
//         units: Object.keys(state.units.byUnitID)
//             .map(key => parseInt(key))
//             .filter(key => !isNaN(key)),
//         unsavedChanges: Object.keys(state.units.editedUnits).length > 0
//     };
// }

// function mapDispatchToProps(dispatch: Dispatch){
//     return {
//         fetchUnitsDetails: () => dispatch(fetchUnitsDetails())
//     }
// }

// export default connect(mapStateToProps, mapDispatchToProps)(UnitDetailComponent);

interface UnitDisplayContainerState{
    units: UnitData[],
    history: UnitData[][]
}

export default class UnitsDetailContainer extends React.Component<{} ,UnitDisplayContainerState> {
    async componentDidMount() {
        const units = await this.fetchUnits();
        this.setState({ units, history: [_.cloneDeep<UnitData[]>(units)]})
    }

    state: UnitDisplayContainerState = {
        units: [],
        history: []
    }

    private async fetchUnits() {
        return await unitsApi.details();
    }

    public render () {
        return (
            <div>
                <HeaderContainer />
                <UnitDetailComponent units={this.state.units} unsavedChanges={false} fetchUnitsDetails={this.fetchUnits}/>
                <FooterContainer />
            </div>
        )
    }
}