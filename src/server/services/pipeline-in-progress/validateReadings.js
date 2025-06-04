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
 * @param {string} meterIdentifier identifier of meter being checked
 * @returns {object} {validReadings, rejectedReadings, errMsg} validReadings: true if readings valid & false otherwise,
 * 	rejectedReadings: array of reading with invalid date/value, errMsg: error message associated with checks.
 */
function validateReadings(arrayToValidate, conditionSet, meterIdentifier = undefined) {
	/* tslint:disable:no-string-literal */
	const { validDates, rejectedDates, errMsg: errMsgDate } = checkDate(arrayToValidate, conditionSet['minDate'], conditionSet['maxDate'], conditionSet['maxError'] / 2, meterIdentifier);
	const { validValues, rejectedValues, errMsg: errMsgValue } = checkValue(arrayToValidate, conditionSet['minVal'], conditionSet['maxVal'], conditionSet['maxError'] / 2, meterIdentifier);
	/* tslint:enable:no-string-literal */
	const errMsg = errMsgDate + errMsgValue;

	let validReadings = validDates && validValues;
	// At the current time rejectedReadings does not seem to be used but leaving for now.
	let rejectedReadings = [];

	// Even when 'reject_none' is set, issues should still be logged
	if (conditionSet['disableChecks'] === 'reject_none') {
		// Note all readings considered valid. Might not be due to checks done above.
		// Unclear why run checks if reject_none but leave it this way. Note error
		// msgs still returned.
		validReadings = true;
	} else {
		if (conditionSet['disableChecks'] === 'reject_bad') {
			// Remove only invalid readings and return the rejected ones
			rejectedReadings = [...rejectedDates, ...rejectedValues];
			arrayToValidate = arrayToValidate.filter(reading => !rejectedReadings.includes(reading));
		} else if (conditionSet['disableChecks'] === 'reject_all' && !validReadings) {
			// Reject all readings if validation fails
			rejectedReadings = [...arrayToValidate];
			// Clear the array
			arrayToValidate = arrayToValidate.slice(0, 0);
		}
	}

	return {
		validReadings,
		rejectedReadings,
		errMsg,
	};
}

/**
 * Check and report any out-of-bound date. Can be ignored by passing null minDate and maxDate
 * @param {Reading[]} arrayToValidate
 * @param {Moment} minDate inclusive earliest acceptable date (won't be rejected)
 * @param {Moment} maxDate inclusive latest acceptable date (won't be rejected)
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 * @param {string} meterIdentifier identifier of meter being checked.
 * @returns {object} {validDates, rejectedDates, errMsg} validDates: true if dates valid & false otherwise, rejectedDates: array of reading with
 * 	invalid dates, errMsg: error message associated with date check.
 */
function checkDate(arrayToValidate, minDate, maxDate, maxError, meterIdentifier) {
	let validDates = true;
	let errMsg = '';
	const rejectedDates = [];
	if (minDate !== null || maxDate !== null) {
		let readingNumber = 0;
		for (const reading of arrayToValidate) {
			readingNumber++;
			if (maxError <= 0) {
				break;
			}
			if (reading.startTimestamp < minDate) {
				const newErrMsg = `Error when checking reading time for #${readingNumber} on meter ${meterIdentifier}: ` +
					`time ${reading.startTimestamp} is earlier than lower bound ${minDate} ` +
					`with reading ${reading.reading} and endTimestamp ${reading.endTimestamp}`;
				log.error(newErrMsg);
				errMsg += '<br>' + newErrMsg + '<br>';
				--maxError;
				validDates = false;
				rejectedDates.push(reading);
			}
			if (reading.endTimestamp > maxDate) {
				const newErrMsg = `Error when checking reading time for #${readingNumber} on meter ${meterIdentifier}: ` +
					`time ${reading.endTimestamp} is later than upper bound ${maxDate} ` +
					`with reading ${reading.reading} and startTimestamp ${reading.startTimestamp}`;
				log.error(newErrMsg);
				errMsg += '<br>' + newErrMsg + '<br>';
				--maxError;
				validDates = false;
				rejectedDates.push(reading);
			}
		}
	}
	return { validDates, rejectedDates, errMsg };
}

/**
 * Check and report any out-of-bound reading value. Can be ignored by passing MIN_VALUE & MAX_VALUE
 * @param {Reading[]} arrayToValidate
 * @param {number} minVal inclusive minimum acceptable reading value (won't be rejected)
 * @param {number} maxVal inclusive maximum acceptable reading value (won't be rejected)
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 * @param {string} meterIdentifier identifier of meter being checked.
 * @returns {object} {validValues, rejectedValues, errMsg} validValues: true if values valid & false otherwise, rejectedValues: array of reading with
 * 	invalid values, errMsg: error message associated with value check.
 */
function checkValue(arrayToValidate, minVal, maxVal, maxError, meterIdentifier) {
	let validValues = true;
	let errMsg = '';
	const rejectedValues = [];
	let readingNumber = 0;
	for (const reading of arrayToValidate) {
		readingNumber++;
		if (maxError <= 0) {
			break;
		}
		if (reading.reading < minVal) {
			const newErrMsg = `Error when checking reading value for #${readingNumber} on meter ${meterIdentifier}: ` +
				`value ${reading.reading} is smaller than lower bound ${minVal} ` +
				`with startTimestamp ${reading.startTimestamp} and endTimestamp ${reading.endTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validValues = false;
			rejectedValues.push(reading);
		} else if (reading.reading > maxVal) {
			const newErrMsg = `Error when checking reading value for #${readingNumber} on meter ${meterIdentifier}: ` +
				`value ${reading.reading} is larger than upper bound ${maxVal} ` +
				`with startTimestamp ${reading.startTimestamp} and endTimestamp ${reading.endTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validValues = false;
			rejectedValues.push(reading);
		}
	}
	return { validValues, rejectedValues, errMsg };
}

/**
 * Check and report unequal intervals. Can be ignore by passing null interval
 * @param {Readings[]} arrayToValidate
 * @param {number} threshold the maximum allowed difference between consecutive data points' intervals
 * @param {string} meterIdentifier identifier of meter being checked.
 * @returns {object} {validIntervals, errMsg} validIntervals: true if intervals valid & false otherwise,
 * 	errMsg: error message associated with interval check.
 */
function checkIntervals(arrayToValidate, threshold, meterIdentifier) {
	let validIntervals = true;
	let errMsg = '';

	if (threshold !== null) {
		// Set the expected interval to be the time gap between the first 2 data points
		const interval = arrayToValidate[1].startTimestamp.diff(arrayToValidate[0].endTimestamp, 'seconds');
		let lastTime = arrayToValidate[1].endTimestamp;

		// Calculate the time gap between every pair of consecutive data points
		let readingNumber = 0;
		for (const reading of arrayToValidate) {
			readingNumber++;
			if (reading === arrayToValidate[0]) {
				continue;
			}
			const currGap = reading.startTimestamp.diff(lastTime, 'seconds');
			// Compare the current time gap with the expected interval. Terminate if the difference is larger than the accepted threshold
			if (Math.abs(currGap - interval) > threshold) {
				const newErrMsg = `warning when checking reading gap for #${readingNumber} on meter ${meterIdentifier}: ` +
					`time gap is detected between current start time ${reading.startTimestamp} and previous end time ${lastTime} that exceeds threshold of ${threshold} ` +
					`with current reading ${reading.reading} and endTimestamp ${reading.endTimestamp}`;
				log.error(newErrMsg);
				errMsg += '<br>' + newErrMsg + '<br>';
				validIntervals = false;
				break;
			}
			lastTime = reading.endTimestamp;
		}
	}
	return { validIntervals, errMsg };
}

/**
 * Validate a single reading based on the provided conditionSet.
 * @param {Reading} reading - The reading object to validate.
 * @param {Object} conditionSet - The validation conditions including min/max values, dates, and thresholds.
 * @returns {boolean} - Returns true if the reading is valid, false otherwise.
 */
function validateSingleReading(reading, conditionSet) {
	const { minVal, maxVal, minDate, maxDate } = conditionSet;

	// Check if the reading falls within the acceptable date range
	if ((minDate && reading.startTimestamp < minDate) || (maxDate && reading.endTimestamp > maxDate)) {
		return false;
	}
	// Check if the reading falls within the acceptable value range
	if ((minVal !== undefined && reading.reading < minVal) || (maxVal !== undefined && reading.reading > maxVal)) {
		return false;
	}
	return true;
}

module.exports = {
	validateReadings,
	checkDate,
	checkValue,
	checkIntervals,
	validateSingleReading
};
