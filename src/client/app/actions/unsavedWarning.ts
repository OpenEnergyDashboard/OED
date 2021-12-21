/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import * as t from '../types/redux/unsavedWarning';

export function updateUnsavedChanges(removeFunction: any, submitFunction: any): t.UpdateUnsavedChangesAction {
    return { 
        type: ActionType.UpdateUnsavedChanges, 
        removeFunction: removeFunction,
        submitFunction: submitFunction
    };
}

export function removeUnsavedChanges(): t.RemoveUnsavedChangesAction {
    return { 
        type: ActionType.RemoveUnsavedChanges
    };
}
