/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';

export type UnsavedWarningAction = UpdateUnsavedChangesAction | RemoveUnsavedChangesAction | FlipLogOutStateAction;

/**
 * The action triggered when there are new unsaved changes
 */
export interface UpdateUnsavedChangesAction {
	type: ActionType.UpdateUnsavedChanges;
	removeFunction: any;
	submitFunction: any;
}

/**
 * The action triggered when the users decide to discard unsaved changes or click the submit button
 */
export interface RemoveUnsavedChangesAction {
	type: ActionType.RemoveUnsavedChanges;
}

export interface FlipLogOutStateAction {
	type: ActionType.FlipLogOutState;
}

export interface UnsavedWarningState {
	hasUnsavedChanges: boolean;
	isLogOutClicked: boolean;
	// The function to remove unsaved changes
	removeFunction: (callback: () => void) => any;
	// The function to submit unsaved changes
	submitFunction: (successCallback: () => void, failureCallback: () => void) => any;
}
