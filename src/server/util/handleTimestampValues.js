/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');

/**
 * Converts a value to an ISO timestamp string using moment, but preserves '-infinity' and 'infinity' for PostgreSQL compatibility.
 * @param {string} timeValue A timestamp, '-infinity', or 'infinity'.
 * @returns {string} The original value if it's '-infinity' or 'infinity', otherwise an ISO-formatted string.
 */
function momentToIsoOrInfinity(timeValue) {
	if (timeValue === '-infinity' || timeValue === 'infinity') {
		return timeValue;
	} 

	return moment(timeValue).toISOString();
}

module.exports = { momentToIsoOrInfinity };