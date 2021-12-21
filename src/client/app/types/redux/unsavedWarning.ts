/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export type UnsavedWarningAction = UpdateUnsavedChangesAction | RemoveUnsavedChangesAction;

/*
* The action triggered when there are new unsaved changes
*/
export interface UpdateUnsavedChangesAction {
	type: ActionType.UpdateUnsavedChanges;
	removeFunction: any;
	submitFunction: any;
}

/*
* The action triggered when the users decide to discard unsaved changes or click the submit button
*/
export interface RemoveUnsavedChangesAction {
	type: ActionType.RemoveUnsavedChanges;
}

export interface UnsavedWarningState {
	hasUnsavedChanges: boolean;
	// The function to remove unsaved changes
	removeFunction: () => any;
	// The function to submit unsaved changes
	submitFunction: () => any;
}
