/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const handleCumulativeReset = require('./handleCumulativeReset');
const { validateReadings } = require('./validateReadings');
const E0 = moment(0);

/**
 * Handle all data, assume that the first row is the first reading (skip this row).
 * @Example
 * 	row 0: reading #0
 *  row 1: reading #1
 * 	row 2: reading #2
 * => reading #1 = row 1
 *    reading #2 = row 2
 *    reading #0 may be the cumulative value from unknown readings that may or may not have been inserted before
 * @param {object[[]]} rows
 * @param {number} meterID meter id being input
 * @param {boolean} isCumulative true if the data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data can reset
 * @param {string} resetStart a string representation in the format of HH:mm:ss.SSS which represents the start time a cumulativeReset may occur after. \
 *  The default resetStart time is 0:00:00.000.
 * @param {string} resetEnd a string representation in the format of HH:mm:ss.SSS which represents the end time a cumulativeReset may occur before. The default resetEnd time is 23:59:99.999
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} onlyEndTime true if the data only has an endTimestamp
 * @param {number} Tgap the allowed time variation in seconds that a gap may occur between two readings 
 * @param {number} Tlen the allowed time variation in seconds that two readings may deviate from each other
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn the connection to the database
 */
async function processData(rows, meterID, isCumulative, cumulativeReset, resetStart = '0:00:00.000', 
					resetEnd = '23:59:99.999', readingRepetition, onlyEndTime = false, Tgap, Tlen, 
					conditionSet, conn) {

	// If processData is successfully finished then return result = [R0, R1, R2...RN]
	const result = [];
	let errMsg = '';
	// Convert Tgap and Tlen to milliseconds to stay consistent with moment.diff() which returns the difference in milliseconds
	const msTgap = Tgap*1000;
	const msTlen = Tlen*1000;
	// Retrieve and set the last reading stored for the meter
	const meter = await Meter.getByID(meterID, conn);
	let meterReading = meter.reading;
	let meterReading1 = meter.reading;
	let meterReading2 = meter.reading;
	let startTimestamp = meter.startTimestamp;
	let endTimestamp = meter.endTimestamp;

	/* The currentReading will represent the current reading being parsed in the csv file. i.e. if index == 1, currentReading = rows[1] where
	*  rows[1] : {reading_value, startTimestamp, endTimestamp}
	*  Note that rows[1] may not contain a startTimestamp and may contain only an endTimestamp which must be reflected by onlyEndTime == True where we have,
	*  rows[1] : {reading_value, endTimestamp}
	*
	*  On entry there is no previousReading yet so intialize it to be the very first date/time since Epoch time. After a currentReading has
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
	for (let index = readingRepetition; index <= rows.length; ++index) {
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if ((index - readingRepetition) % readingRepetition === 0) {
			if (onlyEndTime) {
				// The startTimestamp of this reading is the endTimestamp of the previous reading
				startTimestamp = prevReading.endTimestamp;
				endTimestamp = moment(rows[index - readingRepetition][1], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
			}
			else {
				startTimestamp = moment(rows[index - readingRepetition][1], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
				endTimestamp = moment(rows[index - readingRepetition][2], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
			}
			// Determine the meter reading value to use based on if the data is cumulative or not cumulative
			if (isCumulative) {
				meterReading1 = meter.reading; // In cumulative this is the previous raw reading
				meterReading2 = rows[index - readingRepetition][0]; // In cumulative this is the current raw reading

				// In cumulative the reading we use will be the difference between the current raw reading and the previous raw reading
				// Note the above assumes that the csv file is sorted in ASCENDING ORDER. If it is not in ascending order we must change this.

				meterReading = meterReading2 - meterReading1; // use this ifCumulative. This is the net reading value
				meter.reading = meterReading2; // Update the meter table with the raw cumulative value
			}
			else {
				// The data is not cumulative use the raw reading value
				meterReading = rows[index - readingRepetition][0];
				meter.reading = meterReading;
			}
			if (isCumulative && isFirst(prevReading.endTimestamp)) {
				readingOK = false;
				errMsg = 'The first reading must be dropped when dealing with cumulative data. ';
			}
			if (onlyEndTime && isFirst(prevReading.endTimestamp)) {
				readingOK = false;
				errMsg += 'The first reading must be dropped when dealing only with endTimestamps.';
			}
			if (readingOK && startTimestamp.isSameOrAfter(endTimestamp)) {
				readingOK = false;
				errMsg = 'The reading end time is not after the start time.';
				if (onlyEndTime) {
					errMsg += ' The start time came from the previous readings end time.';
				}
			}
			if (readingOK) {
				// Check that startTimestamp is not before the previous endTimestamp
				if (onlyEndTime && endTimestamp.isSameOrBefore(prevReading.endTimestamp)) {
					readingOK = false;
					errMsg = 'The reading is not after the previous reading with only end time given so we must drop the reading.';
				}
				else if (startTimestamp.isBefore(prevReading.endTimestamp)) {
					if (isCumulative) {
						readingOK = false;
						errMsg = 'The reading start time is before the previous endTime and cumulative so OED cannot use this reading.'
					}
					else if (!isFirst(prevReading.endTimestamp)) {
						//Only treat this as a warning since the readings may be sent in a different order.
						errMsg = 'The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order.';
					}
				}
			}
			if (readingOK && Math.abs(startTimestamp.diff(prevReading.endTimestamp)) > msTgap) {
				if (isCumulative) {
					readingOK = false;
					errMsg = 'The end of the previous reading is too far from the start of the next readings in cumulative data so drop the readings. ';
				}
				else if (!isFirst(prevReading.endTimestamp)) {
					//Only treat this as a warning since we expect a gap in the first ever reading.
					errMsg += 'There is a gap in time between this reading and the previous reading. Note this is treated only as a warning since OED expects a gap to occur in the first ever reading.';
				}
			}
			if (readingOK) {
				// Reject negative readings
				if (isCumulative && meterReading1 < 0) {
					// If the value isCumulative and the prior reading is negative reject unless cumulativeReset is true
					log.error(`DETECTED A NEGATIVE VALUE WHILE HANDLING CUMULATIVE READINGS FROM METER ${meterID}, ` +
						`ROW ${index - readingRepetition}. REJECTED ALL READINGS`);
					return [];
				}
				// To handle cumulative readings that resets at midnight
				if (meterReading < 0) {
					// if meterReading is negative and cumulative check that the times fall within an acceptable reset range
					if (handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp)) {
						meterReading = meterReading2;
						// Note that in the case of a reset the raw cumulative value is still meterReading2
					}
					else {
						//cumulativeReset is not expected but there is a negative meter reading so throw an error
						errMsg = ('A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range.')
						readingOK = false;
					}
				}
				if (readingOK) {
					if (Math.abs(prevReading.endTimestamp.diff(prevReading.startTimestamp) - endTimestamp.diff(startTimestamp)) 
						> msTlen && !isFirst(prevReading.endTimestamp)) {
						errMsg = 'The previous reading has a different time length than the current reading.';
						// If this is true we still add the reading to the results
					}
					// This reading has passed all checks and can be added to result
					currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
					result.push(currentReading);
					if (index === rows.length){
						// This is the last reading in the csv file which contains the reading value, start timestamp and endtimestamp this meter will hold
						meter.startTimestamp = startTimestamp;
						meter.endTimestamp = endTimestamp;
						meter.update(conn);
					}
				}
			}
			if (!readingOK) {
				// An error occurred, for now log it, let the user know and continue
				log.error(`Error parsing Reading # `,index-readingRepetition,`. Reading value gives `,meterReading, ` with error message: `,errMsg);
				readingOK = true;
				if (isCumulative && !onlyEndTime || !isCumulative && onlyEndTime || isCumulative && onlyEndTime) {
					currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
					// This currentReading will become the previousReading for the first reading if isCumulative is true
				}
			}
			prevReading = currentReading;
		}
	}
	if (conditionSet !== undefined && !validateReadings(result, conditionSet)) {
		log.error(`REJECTED ALL READINGS FROM METER ${ipAddress} DUE TO ERROR WHEN VALIDATING DATA`);
		return null;
	}
	return result;
}

/**
 * @param {moment} t moment date/time to compare against the first ever possible moment date/time which may exist
 */
function isFirst(t) {
	return t.isSame(E0);
}

module.exports = processData;