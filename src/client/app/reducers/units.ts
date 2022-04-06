import * as _ from 'lodash';
import { UnitsAction, UnitsState } from '../types/redux/units';
import { ActionType } from '../types/redux/actions';

const defaultState: UnitsState = {
    isFetching: false,
    byUnitID: [],
    selectedUnits: [],
    editedUnits: {},
    submitting: [],
    units: [],
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
                byUnitID: _.keyBy(action.data, unit => unit.id)
            };
        case ActionType.ChangeDisplayedUnits:
            return {
                ...state,
                selectedUnits: action.selectedUnits
            };
        case ActionType.EditUnitDetails:
            editedUnits = state.editedUnits;
            editedUnits[action.unit.id] = action.unit;
            return {
                ...state,
                editedUnits
            };
        case ActionType.SubmitEditedUnit:
            submitting = state.submitting;
            submitting.push(action.unit);
            return {
                ...state,
                submitting
            };
        case ActionType.ConfirmEditedUnit:
            submitting = state.submitting;
            submitting.splice(submitting.indexOf(action.unit));

            const byUnitID = state.byUnitID;
            editedUnits = state.editedUnits;
            byUnitID[action.unit] = editedUnits[action.unit];

            delete editedUnits[action.unit];
            return {
                ...state,
                submitting,
                editedUnits,
                byUnitID
            };
        default:
            return state;
    }
}
