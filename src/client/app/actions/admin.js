/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//export const UPDATE_SELECTED_METER = 'UPDATE_SELECTED_METER';
export const UPDATE_IMPORT_METER = 'UPDATE_IMPORT_METER';
export function updateSelectedMeter(meterID) {
	return { type: UPDATE_IMPORT_METER, meterID };
}
