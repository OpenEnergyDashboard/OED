/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');

const ISO_DURATION_REGEX = /^P(?!$)(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;

/**
 * Returns true if value is a strictly valid ISO 8601 datetime string (with timezone).
 * @param {string} value
 * @returns {boolean}
 */
function isValidIsoDateTime(value) {
	return moment.parseZone(value, moment.ISO_8601, true).isValid();
}

/**
 * Returns true if value is a valid ISO 8601 duration string (e.g. P1Y2M3DT4H5M6S).
 * @param {string} value
 * @returns {boolean}
 */
function isValidIsoDuration(value) {
	return ISO_DURATION_REGEX.test(value);
}

/**
 * Returns true if value is a valid timeInterval string as used by OED's TimeInterval class.
 * Accepted forms: 'all', 'ISO_ISO', 'ISO_' (right unbounded), '_ISO' (left unbounded).
 * Each non-empty timestamp component must be a valid ISO 8601 datetime.
 * @param {string} value
 * @returns {boolean}
 */
function isValidTimeInterval(value) {
	if (value === 'all') return true;
	const underscoreIndex = value.indexOf('_');
	if (underscoreIndex === -1) return false;
	const start = value.substring(0, underscoreIndex);
	const end = value.substring(underscoreIndex + 1);
	// At least one side must be present, and any present side must be a valid ISO datetime.
	if (!start && !end) return false;
	if (start && !isValidIsoDateTime(start)) return false;
	if (end && !isValidIsoDateTime(end)) return false;
	return true;
}

module.exports = { isValidIsoDateTime, isValidIsoDuration, isValidTimeInterval };
