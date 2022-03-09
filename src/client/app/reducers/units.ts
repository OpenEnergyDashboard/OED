 import * as _ from 'lodash';
 import { UnitsAction, UnitState } from '../types/redux/unit';
 import { ActionType } from '../types/redux/actions';
 
 const defaultState: UnitState = {
     isLoading: false, 
     byUnitID: {},
     selectedUnits: [],
     editedUnits: {},
     submitting: []
 };
 
 export default function units(state = defaultState, action: UnitsAction) {
     let submitting;
     let editedUnits;
     switch (action.type) {
         case ActionType.RequestUnitsDetails:
             return {
                 ...state,
                 isFetching: true
             };
         case ActionType.ReceiveUnitsDetails:
             return {
                 ...state,
                 isFetching: false,
                 byunitID: _.keyBy(action.data, unit => unit.id)
             };
         default:
             return state;
     }
 }
 