/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import * as t from '../types/redux/unsavedWarning';

/* eslint-disable jsdoc/require-returns */

/**
 * Notify that there are unsaved changes
 * @param removeFunction The function to remove local changes
 * @param submitFunction The function to submit unsaved changes
 */
export function updateUnsavedChanges(removeFunction: any, submitFunction: any): t.UpdateUnsavedChangesAction {
	return { type: ActionType.UpdateUnsavedChanges, removeFunction, submitFunction };
}

/**
 * Notify that there are no unsaved changes
 */
export function removeUnsavedChanges(): t.RemoveUnsavedChangesAction {
	return { type: ActionType.RemoveUnsavedChanges };
}

/**
 * Notify that the logout button was clicked or unclicked
 */
export function flipLogOutState(): t.FlipLogOutStateAction {
	return { type: ActionType.FlipLogOutState };
}