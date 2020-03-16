/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const { log } = require('../../log');

/**
 * Validate an array of Readings value according to certain criteria
 * @param {array of Readings} arrayToValidate
 * @param {number} minVal minimum acceptable reading value
 * @param {number} maxVal maximum acceptable reading value
 * @param {Moment} minDate earliest acceptable date
 * @param {Moment} maxDate latest acceptable date
 * @param {number} interval the expected interval between reading time in seconds
 * @param {number} maxError the maximum number of errors to be reported, ignore the rest
 */

function validateReadings(arrayToValidate, minVal, maxVal, minDate, maxDate, interval, maxError) {
	validDates = checkDate(arrayToValidate, minDate, maxDate, maxError / 3);
	validValues = checkValue(arrayToValidate, minVal, maxVal, maxError / 3);
	validIntervals = checkIntervals(arrayToValidate, interval, maxError / 3);
	return validDates && validValues && validIntervals;
}

/**
 * Check and report any out-of-bound date. Can be ignored by passing null minDate and maxDate
 * @param {array of Readings} arrayToValidate
 * @param {Moment} minDate earliest acceptable date
 * @param {Moment} maxDate latest acceptable date
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 */
function checkDate(arrayToValidate, minDate, maxDate, maxError) {
	if (minDate === null && maxDate === null) {
		return true;
	}
	validDates = true;
	for (reading of arrayToValidate) {
		if (maxError < 0) {
			break;
		}
		if (reading.startTimestamp.isBefore(minDate)) {
			log.error(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is earlier than lower bound ${minDate}`);
			--maxError;
			validDate = false;
		}
		if (reading.endTimestamp.isAfter(maxDate)) {
			log.error(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is later than upper bound ${maxDate}`);
			--maxError;
			validDate = false;
		}
	}
	return validDates;
}

/**
 * Check and report any out-of-bound reading value. Can be ignored by passing MIN_VALUE & MAX_VALUE
 * @param {array of Readings} arrayToValidate
 * @param {number} minVal maximum acceptable reading value
 * @param {number} maxVal minimum acceptable reading value
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 */
function checkValue(arrayToValidate, minVal, maxVal, maxError) {
	validValues = true;
	for (reading of arrayToValidate) {
		if (maxError < 0) {
			break;
		}
		if (reading.reading < minVal) {
			log.error(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is smaller than lower bound ${minVal}`);
			--maxError;
			validValues = false;
		} else if (reading.reading > maxVal) {
			log.error(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is larger than upper bound ${maxVal}`);
			--maxError;
			validValues = false;
		}
	}
	return validValues;
}

/**
 * Check and report unequal intervals. Can be ignore by passing null interval
 * @param {array of Readings} arrayToValidate
 * @param {number} interval expected gap between 2 consecutive reading times in seconds
 * @param {number} maxError maximum number of errors to be reported. Ignore the rest
 */
function checkIntervals(arrayToValidate, interval, maxError) {
	if (interval == null) {
		return true;
	}
	equalIntervals = true;
	lastTime = arrayToValidate[0].startTimestamp;
	for (reading of arrayToValidate) {
		if (maxError < 0) {
			break;
		}
		if (reading === arrayToValidate[0]) {
			continue;
		}
		if (lastTime.diff(reading.startTimestamp, 'seconds') !== interval) {
			log.error(`UNEQUAL INTERVAL IS DETECTED FROM METER ${reading.meterID}`);
			--maxError;
			equalIntervals = false;
		}
		lastTime = reading.startTimestamp;
	}
	return equalIntervals;
}

module.exports = {
	validateReadings,
	checkDate,
	checkValue,
	checkIntervals
};
