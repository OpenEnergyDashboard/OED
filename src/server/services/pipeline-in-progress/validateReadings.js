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
 * @param {string} meterName name of meter being checked
 */
function validateReadings(arrayToValidate, conditionSet, meterName = undefined) {
	/* tslint:disable:no-string-literal */
	const { validDates, errMsg: errMsgDate } = checkDate(arrayToValidate, conditionSet['minDate'], conditionSet['maxDate'], conditionSet['maxError'] / 2, meterName);
	const { validValues, errMsg: errMsgValue } = checkValue(arrayToValidate, conditionSet['minVal'], conditionSet['maxVal'], conditionSet['maxError'] / 2, meterName);
	/* tslint:enable:no-string-literal */
	const errMsg = errMsgDate + errMsgValue;
	return {
		validReadings: validDates && validValues,
		errMsg,
	};
}

/**
 * Check and report any out-of-bound date. Can be ignored by passing null minDate and maxDate
 * @param {Reading[]} arrayToValidate
 * @param {Moment} minDate inclusive earliest acceptable date (won't be rejected)
 * @param {Moment} maxDate inclusive latest acceptable date (won't be rejected)
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 */
function checkDate(arrayToValidate, minDate, maxDate, maxError, meterName) {
	let validDates = true;
	let errMsg = '';
	if (minDate === null && maxDate === null) {
		return { validDates, errMsg };
	}
	let readingNumber = 0;
	for (const reading of arrayToValidate) {
		readingNumber++;
		if (maxError <= 0) {
			break;
		}
		if (reading.startTimestamp < minDate) {
			const newErrMsg = `error when checking reading time for #${readingNumber} on meter ${meterName}: ` +
				`time ${reading.startTimestamp} is earlier than lower bound ${minDate} ` +
				`with reading ${reading.reading} and endTimestamp ${reading.endTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validDates = false;
		}
		if (reading.endTimestamp > maxDate) {
			const newErrMsg = `error when checking reading time for #${readingNumber} on meter ${meterName}: ` +
				`time ${reading.endTimestamp} is later than upper bound ${maxDate} ` +
				`with reading ${reading.reading} and startTimestamp ${reading.startTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validDates = false;
		}
	}
	return { validDates, errMsg };
}

/**
 * Check and report any out-of-bound reading value. Can be ignored by passing MIN_VALUE & MAX_VALUE
 * @param {Reading[]} arrayToValidate
 * @param {number} minVal inclusive minimum acceptable reading value (won't be rejected)
 * @param {number} maxVal inclusive maximum acceptable reading value (won't be rejected)
 * @param {number} maxError maximum number of errors to be reported, ignore the rest
 */
function checkValue(arrayToValidate, minVal, maxVal, maxError, meterName) {
	let validValues = true;
	let errMsg = '';
	let readingNumber = 0;
	for (const reading of arrayToValidate) {
		readingNumber++;
		if (maxError <= 0) {
			break;
		}
		if (reading.reading < minVal) {
			const newErrMsg = `error when checking reading value for #${readingNumber} on meter ${meterName}: ` +
				`value ${reading.reading} is smaller than lower bound ${minVal} ` +
				`with startTimestamp ${reading.startTimestamp} and endTimestamp ${reading.endTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validValues = false;
		} else if (reading.reading > maxVal) {
			const newErrMsg = `error when checking reading value for #${readingNumber} on meter ${meterName}: ` +
				`value ${reading.reading} is larger than upper bound ${maxVal} ` +
				`with startTimestamp ${reading.startTimestamp} and endTimestamp ${reading.endTimestamp}`;
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			--maxError;
			validValues = false;
		}
	}
	return { validValues, errMsg };
}

/**
 * Check and report unequal intervals. Can be ignore by passing null interval
 * @param {Readings[]} arrayToValidate
 * @param {number} threshold the maximum allowed difference between consecutive data points' intervals
 */
function checkIntervals(arrayToValidate, threshold, meterName) {
	let validIntervals = true;
	let errMsg = '';

	if (threshold === null) {
		return { validIntervals, errMsg };
	}

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
			const newErrMsg = `warning when checking reading gap for #${readingNumber} on meter ${meterName}: ` + 
			`time gap is detected between current start time ${reading.startTimestamp} and previous end time ${lastTime} that exceeds threshold of ${threshold} ` +
			`with current reading ${reading.reading} and endTimestamp ${reading.endTimestamp}`;			
			log.error(newErrMsg);
			errMsg += '<br>' + newErrMsg + '<br>';
			validIntervals = false;
			break;
		}
		lastTime = reading.endTimestamp;
	}
	return { validIntervals, errMsg };
}


module.exports = {
	validateReadings,
	checkDate,
	checkValue,
	checkIntervals
};
