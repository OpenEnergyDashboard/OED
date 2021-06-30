/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { is } = require('core-js/core/object');
const moment = require('moment');
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const handleCumulativeReset = require('./handleCumulativeReset');
const { validateReadings } = require('./validateReadings');
const E0 = moment(0);

/**
 * Handle all data, assume that the first row is the first reading.
 * Also assume that the date/time values are in the format: 'YYYY/MM/DD HH:mm' or 'MM/DD/YYYY HH:mm'
 * @Example
 * 	row 0: reading #0
 *  row 1: reading #1
 * 	row 2: reading #2
 * => reading #1 = row 1
 *    reading #2 = row 2
 *    reading #0 may be the cumulative value from unknown readings that may or may not have been inserted before
 * @param {object[[]]} rows [reading, startTime, endTime] where date/time is either a string or a Moment. Note the start/endTime
 *   are actually date/time where you cannot have the day of month first in date. No start time if isEndOnly true.
 * @param {number} meterID meter id being input
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file, default 'increasing'
 * @param {number} readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} isCumulative true if the data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data can reset
 * @param {string} resetStart a string representation in the format "HH:mm:ss.SSS" which represents the start time a cumulativeReset may occur after\
 *  The default resetStart time is '00:00:00.000'
 * @param {string} resetEnd a string representation in the format "HH:mm:ss.SSS" which represents the end time a cumulativeReset may occur before\
 *  The default resetEnd time is '23:59:99.999'
 * @param {number} readingGap the allowed time variation in seconds that a gap may occur between two readings, default 0
 * @param {number} readingLengthVariation the allowed time variation in seconds that two readings may deviate from each other, default 0
 * @param {boolean} isEndTime true if the data only has an endTimestamp, default false
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn the connection to the database
 * @returns {object[]} {array of readings accepted, true if all readings accepted and false otherwise, all messages from processing}
 */
async function processData(rows, meterID, timeSort = 'increasing', readingRepetition, isCumulative, cumulativeReset,
	resetStart = '00:00:00.000', resetEnd = '23:59:99.999', readingGap = 0, readingLengthVariation = 0, isEndTime = false,
	conditionSet, conn) {
	// Holds all the warning message to pass back to inform user.
	let msgTotal = '';
	// Tells if already passed total message length allowed.
	let msgTotalWarning = false;
	// If all readings were accepted or not.
	let isAllReadingsOk = true;
	// If processData is successfully finished then return result = [R0, R1, R2...RN]
	const result = [];
	const readingsDropped = [];
	const isAscending = (timeSort === 'increasing');
	let errMsg;
	// Convert readingGap and readingLengthVariation to milliseconds to stay consistent with moment.diff() which returns the difference in milliseconds
	const msReadingGap = readingGap * 1000;
	const msReadingLengthVariation = readingLengthVariation * 1000;
	// Retrieve and set the last reading stored for the meter
	// TODO: Create a redux state to hold these values with other meter states
	const meter = await Meter.getByID(meterID, conn);
	let meterReading = meter.reading;
	let meterReading1 = meter.reading;
	let meterReading2 = meter.reading;
	let startTimestamp = meter.startTimestamp;
	let endTimestamp = meter.endTimestamp;
	/* The currentReading will represent the current reading being parsed in the csv file. i.e. if index == 1, currentReading = rows[1] where
	*  rows[1] : {reading_value, startTimestamp, endTimestamp}
	*  Note that rows[1] may not contain a startTimestamp and may contain only an endTimestamp which must be reflected by
	*  onlyEndTime == True where we have,
	*  rows[1] : {reading_value, endTimestamp}
	*
	*  On entry there is no previousReading yet so initialize it to be the very first date/time since Epoch time. After a currentReading has
	*  been processed that currentReading will become the new prevReading. For example,
	*
	*  currentReading = row[1] : {reading_value1, startTimestamp1, endTimestamp1}
	*  prevReading = row[1] : {reading_value1, startTimestamp1, endTimestamp1}
	*  currentReading = row[2] : {reading_value2, startTimestamp2, endTimestamp2}
	*  
	*  If the currentReading passes all checks then we add the currentReading to result and begin parsing and checking the next reading*/
	let currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
	let prevReading = currentReading;
	let readingOK = true;
	// Control values for the loop. By reversing the loop if the readings are decreasing in time they appear
	// to be increasing so it is very similar to the increasing case.
	let startLoop;
	let stepLoop;
	if (isAscending) {
		// The data increases in time so process from first to last row.
		startLoop = 0;
		stepLoop = readingRepetition;
	} else {
		// The data decreases in time so process from the last to first row.
		startLoop = rows.length - readingRepetition;
		stepLoop = -readingRepetition;
	}
	for (let index = startLoop; continueLoop(index, isAscending, rows.length); index += stepLoop) {
		// The logic generally makes it safe to set rather than accumulate the error messages.
		// However, warnings could get lost (since readingOK not false). Since accumulating
		// does not matter in many cases (errMsg) is still empty and protects against edge cases,
		// the code uses accumulation and starts empty each time through the loop.
		errMsg = '';
		// If rows already has a moment (instead of a string) this still works fine.
		// Moment parses readings with date first, time first, dates separated by / or -,
		// times with or without seconds. The date can have the year first or last but
		// cannot have the day first (month okay). Thus, we just use the default parsing.
		// TODO catch error if conversion to moment fails.
		if (isEndTime) {
			// The startTimestamp of this reading is the endTimestamp of the previous reading
			startTimestamp = prevReading.endTimestamp;
			endTimestamp = moment(rows[index][1]);
		}
		else {
			startTimestamp = moment(rows[index][1]);
			endTimestamp = moment(rows[index][2]);
		}
		// Determine the meter reading value to use based on if the data is cumulative or not cumulative
		// TODO should probably check that values are numbers.
		if (isCumulative) {
			meterReading1 = meter.reading; // In cumulative this is the canonical previous raw reading
			meterReading2 = rows[index][0]; // In cumulative this is the canonical current raw reading
			// In cumulative the reading we use will be the difference between the current raw reading and the previous raw reading
			meterReading = meterReading2 - meterReading1;
			meter.reading = meterReading2; // Always update the meter table with the most current raw cumulative value
		}
		else {
			// The data is not cumulative use the raw reading value
			meterReading = rows[index][0];
			meter.reading = meterReading;
		}
		// This value is used when logging messages if done before the last section.
		const logReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
		if (isCumulative && isFirst(prevReading.endTimestamp)) {
			readingOK = false;
			errMsg += 'The first ever reading must be dropped when dealing with cumulative data.<br>';
		}
		if (isEndTime && isFirst(prevReading.endTimestamp)) {
			readingOK = false;
			errMsg += 'The first ever reading must be dropped when dealing only with endTimestamps.<br>';
		}
		if (readingOK && startTimestamp.isSameOrAfter(endTimestamp)) {
			readingOK = false;
			errMsg += 'The reading end time is not after the start time.';
			if (isEndTime) {
				errMsg += ' The start time came from the previous readings end time.';
			}
			errMsg += '<br>';
		}
		if (readingOK) {
			// Check that startTimestamp is not before the previous endTimestamp
			if (isEndTime && endTimestamp.isSameOrBefore(prevReading.endTimestamp)) {
				readingOK = false;
				errMsg += 'The reading is not after the previous reading with only end time given so we must drop the reading.<br>';
			} else if (startTimestamp.isBefore(prevReading.endTimestamp)) {
				if (isCumulative) {
					// If start time of the current reading by canonical order is before the previous readings end time then reject
					// because OED must subtract the previous reading value which cannot be done
					readingOK = false;
					errMsg += 'The reading start time is before the previous end time and the data is cumulative so OED cannot use this reading.<br>';
				} else if (!isFirst(prevReading.endTimestamp)) {
					//Only treat this as a warning since the readings may be sent in a different order.
					errMsg += 'The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order.<br>';
				}
			}
		}
		if (readingOK && Math.abs(startTimestamp.diff(prevReading.endTimestamp)) > msReadingGap) {
			if (isCumulative) {
				/* If the current reading by canonical order is not
				*  immediately after the previous reading by canonical order then there is a gap. If the gap is greater than the expected
				*  variation then OED should drop this reading. */
				readingOK = false;
				errMsg += 'The end of the previous reading is too far from the start of the next readings in cumulative data so drop this reading.<br>';
			} else if (!isFirst(prevReading.endTimestamp)) {
				// Only treat this as a warning. We don't warn on the first ever reading since we expect a gap in that case.
				errMsg += 'There is a gap in time between this reading and the previous reading that exceeds the allowed amount of ' +
					msReadingGap / 1000 + ' seconds.<br>';
			}
		}
		if (readingOK) {
			// Reject negative readings for cumulative.
			// Note one can make the case that we should accept them since we don't automatically exclude negative readings.
			// The conditionSet could be used instead to catch this if desired. However, we decided that cumulative
			// normally don't go negative so are excluding these values.
			// This could be changed by commenting out this block of code. Note that the next reading will be larger than
			// what is received since subtracting the previous negative reading.
			if (isCumulative && meterReading2 < 0) {
				// If the value isCumulative and the prior reading is negative reject because OED cannot accept any negative readings.
				// You go back by readingRepetition since this is the previous reading.
				let negRow = row(index, isAscending, rows.length) - readingRepetition + 1;
				if (negRow < 1) {
					// The previous reading came from meter not this CSV file.
					errMsg += 'The last meter reading (logical previous reading) was negative with value ' + meterReading1 +
						'. With cumulative readings the previous reading cannot be negative so all reading are rejected.<br>';
				} else {
					errMsg += '<br>Error parsing Reading #' + negRow +
						'. Detected a negative value while handling cumulative readings so all reading are rejected.<br>';
				}
				log.error(errMsg);
				errMsg += logStatus(negRow, prevReading, logReading, timeSort, readingRepetition, isCumulative, cumulativeReset,
					resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
				let { message, alreadyWarned } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning);
				msgTotal = message;
				msgTotalWarning = alreadyWarned;
				// This empties the result array. Should be fast and okay with const.
				result.splice(0, result.length);
				isAllReadingsOk = false;
				return { result, isAllReadingsOk, msgTotal };
			}
			// To handle net cumulative readings which are negative.
			if (meterReading < 0) {
				// if meterReading is negative and cumulative check that the times fall within an acceptable reset range
				if (handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp)) {
					// If there is a cumulative reset then the meterReading should always use the canonical previous raw reading value
					meterReading = meterReading2;
				} else {
					//cumulativeReset is not expected but there is a negative net meter reading so reject all readings.
					errMsg += ('<br>Error parsing Reading #' + row(index, isAscending, rows.length) + '. Reading value of ' + meterReading2 + ' gives ' +
						meterReading + ' with error message:<br>A negative meterReading has been detected but either cumulativeReset' +
						' is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>');
					log.error(errMsg);
					errMsg += logStatus(row(index, isAscending, rows.length), prevReading, logReading, timeSort, readingRepetition, isCumulative, cumulativeReset,
						resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
					let { message, alreadyWarned } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning);
					msgTotal = message;
					msgTotalWarning = alreadyWarned;
					// This empties the result array. Should be fast and okay with const.
					result.splice(0, result.length);
					isAllReadingsOk = false;
					return { result, isAllReadingsOk, msgTotal };
				}
			}
		}
		if (readingOK) {
			if (Math.abs(prevReading.endTimestamp.diff(prevReading.startTimestamp) - endTimestamp.diff(startTimestamp))
				> msReadingLengthVariation && !isFirst(prevReading.endTimestamp)) {
				// The previous reading cannot be the the first one since reading length not from a real reading.
				if (!isFirst(prevReading.startTimestamp)) {
					errMsg += 'The previous reading has a different time length than the current reading and exceeds the tolerance of ' +
						msReadingLengthVariation / 1000 +
						' seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>';
					// If this is true we still add the reading to the results
				}
			}
			// This reading has passed all checks and can be added to result
			currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
			if (!(errMsg === '')) {
				// There may be warnings to output even if OED accepts the readings so output all warnings which may exist
				errMsg = '<br>Warning parsing Reading #' + row(index, isAscending, rows.length) + '. Reading value gives ' +
					meterReading + ' with warning message:<br>' + errMsg;
				log.warn(errMsg);
				errMsg += logStatus(row(index, isAscending, rows.length), prevReading, currentReading, timeSort, readingRepetition, isCumulative, cumulativeReset,
					resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
				let { message, alreadyWarned } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning);
				msgTotal = message;
				msgTotalWarning = alreadyWarned;
			}
			result.push(currentReading);
		} else {
			// An error occurred so add it to the readings dropped array and let the client know why before continuing
			/* If the data is cumulative then regardless of if it comes with end timestamps only or both end timestamps and start timestamps
			*  the first reading ever should become the previous reading. This is necessary because there are no previous readings in the db
			*  yet so we must drop the first point ever and use this first point as the first previous reading in order to begin calculating
			*  net readings since the data is cumulative.
			*
			*  If the data is not cumulative but there are only end timestamps then we still must drop the first reading ever in order to use
			*  that reading as the first start timestamp for the next reading. All following readings can then use the previous end timestamps
			*  as the current readings start timestamp until all further readings have been processed.*/
			if (isCumulative || (!isCumulative && isEndTime)) {
				currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
				// This currentReading will become the previousReading for the first reading if isCumulative is true
			}
			errMsg = '<br>Error parsing Reading #' + row(index, isAscending, rows.length) + '. Reading value gives ' + meterReading +
				' with error message:<br>' + errMsg;
			log.error(errMsg);
			errMsg += logStatus(row(index, isAscending, rows.length), prevReading, currentReading, timeSort, readingRepetition, isCumulative, cumulativeReset,
				resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
			let { message, alreadyWarned } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning);
			msgTotal = message;
			msgTotalWarning = alreadyWarned;
			isAllReadingsOk = false;
			readingOK = true;
			// index-readingRepetition = reading # dropped in the data
			readingsDropped.push(row(index, isAscending, rows.length));
		}
		prevReading = currentReading;
	}
	// Validate data if conditions given
	if (conditionSet !== undefined && !validateReadings(result, conditionSet)) {
		errMsg = `<h2>REJECTED ALL READINGS FROM METER ${ipAddress} DUE TO ERROR WHEN VALIDATING DATA</h2>`;
		let { message, alreadyWarned } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning);
		msgTotal = message;
		msgTotalWarning = alreadyWarned;
		log.error(errMsg);
		// This empties the result array. Should be fast and okay with const.
		result.splice(0, result.length);
		isAllReadingsOk = false;
		return { result, isAllReadingsOk, msgTotal };
	}
	// Update the meter to contain information for the last reading in the data file.
	// Note this means that even if the last value was rejected we still store it as
	// the next previous reading. This is probably a good idea, in general, but it is
	// possible an undesirable time is saved at points. This will lead to messages on
	// the next upload. Also note that the update does not happen if all the values
	// are rejected as a batch (so return before this point).
	meter.startTimestamp = startTimestamp;
	meter.endTimestamp = endTimestamp;
	await meter.update(conn);
	// Let the user know exactly which readings were dropped if any before continuing and add to the total messages.
	if (readingsDropped.length !== 0) {
		let { message, alreadyWarned } = appendMsgTotal(msgTotal, '<h2>Readings Dropped and should have previous messages</h2><ol>', msgTotalWarning);
		msgTotal = message;
		msgTotalWarning = alreadyWarned;
		readingsDropped.forEach(readingNum => {
			let messageNew = '<li>Dropped Reading #' + readingNum + '</li>'; log.info(messageNew);
			let { message, alreadyWarned } = appendMsgTotal(msgTotal, messageNew, msgTotalWarning);
			msgTotal = message;
			msgTotalWarning = alreadyWarned;
		});
		// Assume the <ol> was put in. If not, get minor HTML syntax issue.
		msgTotal += '</ol>';
	}
	return { result, isAllReadingsOk, msgTotal };
}

/**
 * @param {moment} t moment date/time to compare against the first ever possible moment date/time which may exist
 */
function isFirst(t) {
	return t.isSame(E0);
}

/** Tell if the main for loop should continue.
 * @param index the current index of the loop
 * @param isAscending true if rows are chronologically increasing and false if reverse
 * @param length the number of rows
 * @returns true if loop should continue and false otherwise
 */
function continueLoop(index, isAscending, length) {
	if (isAscending) {
		// The loop is increasing chronologically so need to see if past end of array
		// since going from first to last.
		return index < length;
	} else {
		// The loop is decreasing chronologically so need to see if past start of array
		// since going from last to first.
		return index >= 0;
	}
}

/** Converts the loop index into a reading row.
 * @param index the current index of the loop
 * @param isAscending true if rows are chronologically increasing and false if reverse
 * @param length the number of rows
 * @returns reading row from index
 */
function row(index, isAscending, length) {
	if (isAscending) {
		// Started with row 0/first row of CSV so readings are shifted up by 1.
		return index + 1
	} else {
		// Stared with last row of CSV so readings are the number of readings minus the index.
		return length - index;
	}
}

/**
 * info logs information about pipeline where parameters are all the current information.
 * This is normally done right after something was logged to give more context.
 * Note that the logging sometimes puts the output a little earlier/later when there are
 * multiple messages. It seems to be something about the logging and not looked into.
 * @returns {string} The message just logged.
 */
function logStatus(rowNum, prevReading, currentReading, timeSort, readingRepetition, isCumulative,
	cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, onlyEndTime) {
	let message = 'For reading #' + rowNum + ' in pipeline: ' + 'previous reading has value ' + prevReading.reading + ' start time '
		+ prevReading.startTimestamp.format() + ' end time ' + prevReading.endTimestamp.format() + ' and current reading has value '
		+ currentReading.reading + ' start time ' + currentReading.startTimestamp.format() + ' end time ' + currentReading.endTimestamp.format()
		+ ' with timeSort ' + timeSort + '; duplications ' + readingRepetition + '; cumulative ' +
		isCumulative + '; cumulativeReset ' + cumulativeReset + '; cumulativeResetStart ' + resetStart + '; cumulativeResetEnd ' + resetEnd +
		'; lengthGap ' + readingGap + '; lengthVariation ' + readingLengthVariation + '; onlyEndTime ' + onlyEndTime;
	log.info(message);
	return message;
}

/**
 * Updates the string with all messages as long as it does not exceed the max size.
 * @param {string} message The current total message to add to
 * @param {string} newMsg The new message to append
 * @param {boolean} alreadyWarned false if have not yet exceeded the allowed message size and true otherwise.
 * @returns {object[]} {the updated message, update message warning}
 */
function appendMsgTotal(message, newMsg, alreadyWarned) {
	// The limit to number of characters in the msgTotal.
	// Each message with the reading info is in the 1k byte range. If limit to 75K
	// then get around 75+ messages and that seems good without being too large a
	// return message.
	// Note that at this time we are not limiting the messages that are logged.
	// This means the log file could get large if a lot of bad points are sent.
	const MAX_SIZE = 75000;
	if (message.length < MAX_SIZE) {
		message += newMsg;
	} else if (!alreadyWarned) {
		message = "<h1>WARNING - The total number of messages was stopped due to size." +
			" The log file has all the messages.</h1>" + message + "<h1>Message lost starting now</h1>";
		// Note that warned so goes from false to true.
		alreadyWarned = !alreadyWarned;
	}
	return { message, alreadyWarned };
}

module.exports = processData;