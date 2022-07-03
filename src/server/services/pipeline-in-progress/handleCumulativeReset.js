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
		// The range test is if the start time is within the reset time.
		testStart = startTimestamp;
		// Need the reset to be on a day relative to the testStart day.
		// The resetStartDuration and resetEndDuration is a time without a date.
		let resetStartDuration = moment.duration(resetStart);
		let resetEndDuration = moment.duration(resetEnd);
		// Do by getting the start of the day for testStart and then adding in the time for reset.
		// The clone is necessary since startOf mutates the moment object.
		let testResetStart = moment(testStart.clone().startOf('day') + resetStartDuration);
		if (resetStartDuration.subtract(resetEndDuration) > 0) {
			// If the start time is after the end time for reset then the start time is for the previous day.
			testResetStart = testResetStart.subtract(1, 'days');
		}
		let testResetEnd = moment(testStart.clone().startOf('day') + moment.duration(resetEnd));
		// While testResetStart/End is in local timezone and startTimestamp is in UTC timezone,
		// moment still does the test correctly.
		if (testStart.isSameOrAfter(testResetStart) && testStart.isSameOrBefore(testResetEnd)) {
			// The reading is between the reset times so it is okay to use.
			return true;
		} else {
			// Reset not valid.
			return false;
		}
	}
}

module.exports = handleCumulativeReset