/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export type UnsavedWarningAction = UpdateUnsavedChangesAction | RemoveUnsavedChangesAction;

export interface UpdateUnsavedChangesAction {
	type: ActionType.UpdateUnsavedChanges;
}

export interface RemoveUnsavedChangesAction {
	type: ActionType.RemoveUnsavedChanges;
}

export interface UnsavedWarningState {
	hasUnsavedChanges: boolean;
}
