/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const LOGO_STATE_CHANGED = 'LOGO_STATE_CHANGED';

/**
 * @param {bool} showColored is the logo state colored or uncolored?
 * @returns An action to change the state of the logo
 */
export function logoStateChanged(showColored) {
	return { type: LOGO_STATE_CHANGED, showColored: showColored };
}
