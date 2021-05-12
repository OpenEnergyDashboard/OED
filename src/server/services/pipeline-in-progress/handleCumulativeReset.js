/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
/**
 * @param {boolean} cumulativeReset true if the client expects to handle cumulativeReset
 * @param {string} resetStart a string representation of the start time a cumulativeReset may occur after
 * @param {string} resetEnd a string representation of the end time a cumulativeReset may occur before
 * @param {moment} startTimestamp start time of a current reading
 * @returns {boolean} returns true if the current reading can be reset else returns false
 */
function handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp) {
	if (!cumulativeReset) {
		// If isCumulative is false then it is not possible to handleCumulativeReset
		return false;
	}
	else {
		let momentFormat = '';
		// Use strict parsing so input startTimestamp must exactly match the specified format and invalid dates are caught instead of incorrect dates.
		if (moment(startTimestamp, 'YYYY-MM-DD', true).isValid()) {
			// Check if the startTimestamp is passed in the date format "Year-Month-Day" and append time to it if the startTimestamp is in this format.
			momentFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
		}
		else {
			// If the startTimestamp is not in the format "Year-Month-Day" we expect that the date format must be "Month-Day-Year".
			momentFormat = 'MM-DD-YYYY HH:mm:ss.SSS';
		}
		let testStart = moment(startTimestamp);
		// Use momentFormat to define the start and end dates to check if the cumulative drop occurs within the expected resetStart time and resetEnd time.
		let testResetStart = moment(testStart.format(momentFormat) + ' ' + resetStart, ['YYYY/MM/DD HH:mm:ss.SSS', 'MM/DD/YYYY HH:mm:ss.SSS']);
		let testResetEnd = moment(testStart.format(momentFormat) + ' ' + resetEnd, ['YYYY/MM/DD HH:mm:ss.SSS', 'MM/DD/YYYY HH:mm:ss.SSS']);
		if (testStart.isSameOrAfter(testResetStart) && testStart.isSameOrBefore(testResetEnd)) {
			return true;
		}
	}
	return false;
}

module.exports = handleCumulativeReset