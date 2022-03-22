/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UnitsAction } from "types/redux/units";
import { ActionType } from "../types/redux/actions";

const defaultState = {
    isFetching: false,
    units: []
};

export default function units(state = defaultState, action: UnitsAction) {
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
                units: action.data
            };
        default:
            return state;
    }
} 