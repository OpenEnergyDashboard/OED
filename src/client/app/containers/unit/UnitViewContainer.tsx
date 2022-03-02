import * as React from 'react';
import {State} from '../../types/redux/state'
import UnitViewComponent from '../../components/unit/UnitViewComponent.tsx'
import {Dispatch} from '../../types/redux/actions'
import { connect } from 'react-redux';

function mapStateToProps(state: State, ownProps: {id: number}){
    let unit = state.units.byUnitID[ownProps.id];
    if(state.units.editedUnits[ownProps.id]){
        unit = state.units.editedUnits[ownProps.id];
    }
    return{
        unit,
        isEdited: state.units.editedUnits[ownProps.id] !== undefined,
    }
}

export default connect(mapStateToProps)(UnitViewComponent);