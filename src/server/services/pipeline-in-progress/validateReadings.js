/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const { log } = require('../../log');

/**
 * Validate an array of Readings value according to certain criteria
 * @param {Reading[]} arrayToValidate
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, threshold, maxError)
 */
function validateReadings(arrayToValidate, conditionSet) {
	validDates = checkDate(arrayToValidate, conditionSet['minDate'], conditionSet['maxDate'], conditionSet['maxError'] / 2);
	validValues = checkValue(arrayToValidate, conditionSet['minVal'], conditionSet['maxVal'], conditionSet['maxError'] / 2);
	validIntervals = checkIntervals(arrayToValidate, conditionSet['threshold']);
	return validDates && validValues && validIntervals;
}

/**
 * Check and report any out-of-bound date. Can be ignored by passing null minDate and maxDate
 * @param {Reading[]} arrayToValidate
 * @param {Moment} minDate inclusive earliest acceptable date (won't be rejected)
 * @param {Moment} maxDate inclusive latest acceptable date (won't be rejected)
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
		if (reading.startTimestamp < minDate) {
			log.warn(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is earlier than lower bound ${minDate}`);
			--maxError;
			validDates = false;
		}
		if (reading.endTimestamp > maxDate) {
			log.warn(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is later than upper bound ${maxDate}`);
			--maxError;
			validDates = false;
		}
	}
	return validDates;
}

/**
 * Check and report any out-of-bound reading value. Can be ignored by passing MIN_VALUE & MAX_VALUE
 * @param {Reading[]} arrayToValidate
 * @param {number} minVal inclusive minimum acceptable reading value (won't be rejected)
 * @param {number} maxVal inclusive maximum acceptable reading value (won't be rejected)
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 */
function checkValue(arrayToValidate, minVal, maxVal, maxError) {
	validValues = true;
	for (reading of arrayToValidate) {
		if (maxError <= 0) {
			break;
		}
		if (reading.reading < minVal) {
			log.warn(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: Value ${reading.reading} is smaller than lower bound ${minVal}`);
			--maxError;
			validValues = false;
		} else if (reading.reading > maxVal) {
			log.warn(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: Value ${reading.reading} is larger than upper bound ${maxVal}`);
			--maxError;
			validValues = false;
		}
	}
	return validValues;
}

/**
 * Check and report unequal intervals. Can be ignore by passing null interval
 * @param {array of Readings} arrayToValidate
 * @param {number} threshold the maximum allowed difference between consecutive data points' intervals
 */
function checkIntervals(arrayToValidate, threshold) {
	if (threshold === null) {
		return true;
	}
	// Set the expected interval to be the time gap between the first 2 data points
	interval = arrayToValidate[1].startTimestamp.diff(arrayToValidate[0].endTimestamp, 'seconds');
	lastTime = arrayToValidate[1].endTimestamp;
	// Calculate the time gap between every pair of consecutive data points 
	for (reading of arrayToValidate) {
		if (reading === arrayToValidate[0]) {
			continue;
		}
		currGap = reading.startTimestamp.diff(lastTime, 'seconds');
		// Compare the current time gap with the expected interval. Terminate if the difference is larger than accepted threshold
		if (Math.abs(currGap - interval) > threshold) {
			log.error(`UNEQUAL INTERVAL IS DETECTED FROM METER ${reading.meterID}: Time gap between ${reading.startTimestamp} and ${lastTime} is too big`);
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
