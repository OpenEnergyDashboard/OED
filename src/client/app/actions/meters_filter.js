/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const METERS_FILTER_MODIFIED = 'METERS_FILTER_MODIFIED';
export const METERS_FILTER_CLEARED = 'METERS_FILTER_CLEARED';

/**
 * Returns an action signifying that the meters filter was changed to the
 * given term.
 * @param {string} term The term to which the filter is set
 */
export function metersFilterModified(term) {
	return { type: METERS_FILTER_MODIFIED, term: term };
}

/**
 * Returns an action signifying that the meters filter was cleared.
 */
export function metersFilterCleared() {
	return { type: METERS_FILTER_CLEARED };
}
