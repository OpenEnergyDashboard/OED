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
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 */

function validateReadings(arrayToValidate, conditionSet) {
	validDates = checkDate(arrayToValidate, conditionSet['minDate'], conditionSet['maxDate'], conditionSet['maxError'] / 2);
	validValues = checkValue(arrayToValidate, conditionSet['minVal'], conditionSet['maxVal'], conditionSet['maxError'] / 2);
	validIntervals = checkIntervals(arrayToValidate, conditionSet['interval']);
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
		if (maxError <= 0) {
			break;
		}
		if (reading.startTimestamp.isBefore(minDate)) {
			log.warn(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is earlier than lower bound ${minDate}`);
			--maxError;
			validDates = false;
		}
		if (reading.endTimestamp.isAfter(maxDate)) {
			log.warn(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is later than upper bound ${maxDate}`);
			--maxError;
			validDates = false;
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
		if (maxError <= 0) {
			break;
		}
		if (reading.reading < minVal) {
			log.warn(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is smaller than lower bound ${minVal}`);
			--maxError;
			validValues = false;
		} else if (reading.reading > maxVal) {
			log.warn(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is larger than upper bound ${maxVal}`);
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
function checkIntervals(arrayToValidate, threshold) {
	if (threshold === null) {
		return true;
	}
	interval = arrayToValidate[1].startTimestamp - arrayToValidate[0].endTimestamp;
	lastTime = arrayToValidate[1].endTimestamp;
	for (reading of arrayToValidate) {
		if (reading === arrayToValidate[0]) {
			continue;
		}
		currGap = reading.startTimestamp.diff(lastTime, 'seconds');
		if (currGap < interval - threshold || currGap > interval + threshold) {
			log.warn(`UNEQUAL INTERVAL IS DETECTED FROM METER ${reading.meterID}`);
			return false;
		}
		lastTime = reading.endTimestamp;
	}
	return true;
}

module.exports = {
	validateReadings,
	checkDate,
	checkValue,
	checkIntervals
};
