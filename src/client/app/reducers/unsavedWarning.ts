/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UnsavedWarningAction, UnsavedWarningState } from '../types/redux/unsavedWarning';
import { ActionType } from '../types/redux/actions';

const defaultState: UnsavedWarningState = { hasUnsavedChanges: false };

export default function unsavedWarning(state = defaultState, action: UnsavedWarningAction) {
    switch (action.type) {
        case ActionType.UpdateUnsavedChanges:
            return {
                ...state,
                hasUnsavedChanges: true
            }
        case ActionType.RemoveUnsavedChanges:
            return {
                ...state,
                hasUnsavedChanges: false
            }
        default:
            return state;
    }
}
