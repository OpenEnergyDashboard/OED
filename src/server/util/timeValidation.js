/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');

const ISO_DURATION_REGEX = /^P(?!$)(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;
const ISO_DATETIME_WITH_TIMEZONE_REGEX = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Returns true if value is a strictly valid ISO 8601 datetime string (with timezone).
 * @param {string} value
 * @returns {boolean}
 */
function isValidIsoDateTime(value) {
	if (typeof value !== 'string') {
		return false;
	}
	return ISO_DATETIME_WITH_TIMEZONE_REGEX.test(value) && moment.parseZone(value, moment.ISO_8601, true).isValid();
}

/**
 * Returns true if value is a valid ISO 8601 duration string (e.g. P1Y2M3DT4H5M6S).
 * @param {string} value
 * @returns {boolean}
 */
function isValidIsoDuration(value) {
	if (typeof value !== 'string') {
		return false;
	}
	const duration = moment.duration(value);
	return ISO_DURATION_REGEX.test(value) && moment.isDuration(duration) && duration.isValid() && duration.asMilliseconds() > 0;
}

/**
 * Returns true if value is a valid timeInterval string as used by OED's TimeInterval class.
 * Accepted forms: 'all', 'ISO_ISO', and optionally 'ISO_' (right unbounded) or '_ISO' (left unbounded).
 * Each non-empty timestamp component must be a valid ISO 8601 datetime.
 * @param {string} value
 * @param {boolean} allowOneSided true if 'ISO_' and '_ISO' should be accepted
 * @returns {boolean}
 */
function isValidTimeInterval(value, allowOneSided = false) {
	if (typeof value !== 'string') {
		return false;
	}
	// 'all' means an unbounded interval covering all available data.
	if (value === 'all') {
		return true;
	}
	// A time interval needs an underscore between the start and end times.
	const underscoreIndex = value.indexOf('_');
	if (underscoreIndex === -1) {
		return false;
	}
	const start = value.substring(0, underscoreIndex);
	const end = value.substring(underscoreIndex + 1);
	// Empty start or end times are allowed only when the route supports them.
	if ((!start || !end) && !allowOneSided) {
		return false;
	}
	// Reject '_' because it has no start or end time.
	if (!start && !end) {
		return false;
	}
	// Check the start and end times only if they were provided.
	if (start && !isValidIsoDateTime(start)) {
		return false;
	}
	if (end && !isValidIsoDateTime(end)) {
		return false;
	}
	return true;
}

module.exports = { isValidIsoDateTime, isValidIsoDuration, isValidTimeInterval };
