/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('./../models/Reading');
const { log } = require('../log');

/**
 * Validate an array of Readings value according to certain criteria
 * @param {array of Readings} arrayToValidate 
 * @param {number} maxVal maximum acceptable reading value 
 * @param {number} minVal minimum acceptable reading value
 * @param {Moment} minDate earliest acceptable date
 * @param {Moment} maxDate latest acceptable date
 * @param {boolean} interval the expected interval between reading time
 */

function validateReadings(arrayToValidate, maxVal, minVal, minDate, maxDate, interval) {
	validDates = checkDate(arrayToValidate, minDate, maxDate);
	validValues = checkValue(arayToValidate, minVal, maxVal);
	validIntervals = checkIntervals(arrayToValidate, interval);
	return validDates && validValues && validIntervals;
}

function checkDate(arrayToValidate, minDate, maxDate) {
	for (reading in arrayToValidate) {
		if (reading.startTimestamp.isBefore(minDate)) {
			log.error(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is earlier than lower bound ${minDate}`);
			return false;
		}
		if (reading.endTimestamp.isAfter(maxDate)) {
			log.error(`ERROR WHEN CHECKING READING TIME FROM METER ${reading.meterID}: Time ${reading.startTimestamp} is later than upper bound ${maxDate}`);
			return false;
		}
	}cocov
	return true;
}

function checkValue(arrayToValidate, minVal, maxVal) {
	for (reading in arrayToValidate) {
		if (reading.reading < minVal) {
			log.error(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is smaller than lower bound ${minVal}`);
			return false;
		} else if (reading.reading > maxDate) {
			log.error(`ERROR WHEN CHECKING READING VALUE FROM METER ${reading.meterID}: ${reading.reading} is larger than upper bound ${maxVal}`);
			return false;
		}
	}
	return true;	
}

function checkIntervals(arrayToValidate, interval) {
	if (interval == null) return true;
	lastTime = null
	for (reading in arrayToValidate) {
		if (lastTime == null) {
			lastTime = reading.startTimestamp;
			continue;
		}
		if (lastTime.diff(reading.startTimestamp()) != interval) {
			return false;
		}
	}
	return true;
}
module.exports = validateReadings;
