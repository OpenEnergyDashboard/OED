/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Determines whether a unit is suffix-related. Meaning either an OED-created
 * suffix-type unit (typeOfUnit === 'suffix'), or a "Suffix Input" unit
 * with a non-empty suffix string set on it. Matches the same check used
 * by the unit create/edit modals (no trimming, plain '' comparison).
 * @param {*} unit The unit to check. May be undefined.
 * @returns {boolean}
 */
function isSuffixRelated(unit) {
	return !!unit && (unit.typeOfUnit === 'suffix' || unit.suffix !== '');
}

module.exports = {
	isSuffixRelated
 };