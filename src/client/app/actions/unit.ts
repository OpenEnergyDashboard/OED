import {ActionType, Dispatch, Thunk} from '../types/redux/actions';
import * as t from '../types/redux/unit'
import {unitsApi} from '../utils/api';
import { NamedIDItem } from '../types/items';

function requestUnitsDetails(): t.RequestUnitsDetailsAction {
    return { type: ActionType.RequestUnitsDetails}
}

function receiveUnitsDetails(data: NamedIDItem[]): t.ReceiveUnitsDetailsAction{
    return {type: ActionType.ReceiveUnitsDetails, data}
} 

export function fetchUnitsDetails(): Thunk{
    return async (dispatch: Dispatch) => {
        dispatch(requestUnitsDetails());
        const unitsDetails = await unitsApi.details();
        dispatch(receiveUnitsDetails(unitsDetails));
    }
}