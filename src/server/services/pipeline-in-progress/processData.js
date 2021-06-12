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
 * @param {object[[]]} rows
 * @param {number} meterID meter id being input
 * @param {boolean} isCumulative true if the data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data can reset
 * @param {string} resetStart a string representation in the format "HH:mm:ss.SSS" which represents the start time a cumulativeReset may occur after\
 *  The default resetStart time is '00:00:00.000'
 * @param {string} resetEnd a string representation in the format "HH:mm:ss.SSS" which represents the end time a cumulativeReset may occur before\
 *  The default resetEnd time is '23:59:99.999'
 * @param {number} readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} onlyEndTime true if the data only has an endTimestamp, default false
 * @param {number} Tgap the allowed time variation in seconds that a gap may occur between two readings, default 0
 * @param {number} Tlen the allowed time variation in seconds that two readings may deviate from each other, default 0
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file, default 'increasing'
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn the connection to the database
 */
async function processData(rows, meterID, isCumulative, cumulativeReset, resetStart = '00:00:00.000',
	resetEnd = '23:59:99.999', readingRepetition, onlyEndTime = false, Tgap = 0, Tlen = 0,
	timeSort = 'increasing', conditionSet, conn) {

	// If processData is successfully finished then return result = [R0, R1, R2...RN]
	const result = [];
	const readingsDropped = [];
	const isAscending = (timeSort === 'increasing');
	let errMsg = '';
	// Convert Tgap and Tlen to milliseconds to stay consistent with moment.diff() which returns the difference in milliseconds
	const msTgap = Tgap * 1000;
	const msTlen = Tlen * 1000;
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
	for (let index = 0; index < rows.length; index += readingRepetition) {
		errMsg = '';
		if (onlyEndTime) {
			// The startTimestamp of this reading is the endTimestamp of the previous reading
			startTimestamp = prevReading.endTimestamp;
			endTimestamp = moment(rows[index][1], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
		}
		else {
			startTimestamp = moment(rows[index][1], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
			endTimestamp = moment(rows[index][2], ['YYYY/MM/DD HH:mm', 'MM/DD/YYYY HH:mm']);
		}
		// Determine the meter reading value to use based on if the data is cumulative or not cumulative
		if (isCumulative) {
			meterReading1 = meter.reading; // In cumulative this is the canonical previous raw reading
			meterReading2 = rows[index][0]; // In cumulative this is the canonical current raw reading

			// In cumulative the reading we use will be the difference between the current raw reading and the previous raw reading
			// Note the above assumes that the csv file is sorted in ASCENDING ORDER. If it is not in ascending order we must change this

			if (isAscending) {
				meterReading = meterReading2 - meterReading1; // use this ifCumulative. This is the net reading value
			}
			else {
				meterReading = meterReading1 - meterReading2;
			}
			meter.reading = meterReading2; // Always update the meter table with the most current raw cumulative value
		}
		else {
			// The data is not cumulative use the raw reading value
			meterReading = rows[index][0];
			meter.reading = meterReading;
		}
		if (isCumulative && isFirst(prevReading.endTimestamp)) {
			readingOK = false;
			errMsg = 'The first ever reading must be dropped when dealing with cumulative data. ';
		}
		if (onlyEndTime && isFirst(prevReading.endTimestamp)) {
			readingOK = false;
			errMsg += 'The first ever reading must be dropped when dealing only with endTimestamps.';
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
			else if ((!isAscending && startTimestamp.isAfter(prevReading.endTimestamp))
				|| (isAscending && startTimestamp.isBefore(prevReading.endTimestamp))) {
				if (isCumulative) {
					/* Check if the data is in ascending order. If it is and the start time of the current reading by canonical order is
					*  before the previous readings end time then reject because OED must subtract the previous reading value which cannot be done
					*
					*  If the data is in descending order and the start time of the current reading by canonical order is after the previous readings
					*  end time then also reject because OED cannot use the previous reading value in order to determine the correct net
					*  reading value.*/
					readingOK = false;
					if (isAscending) {
						errMsg = 'The reading start time is before the previous end time and the data is cumulative and in ascending order so OED cannot use this reading.';
					}
					else {
						errMsg = 'The reading start time is after the previous end time and the data is cumulative and in descending order so OED cannot use this reading.';
					}
				}
				else if (!isFirst(prevReading.endTimestamp)) {
					//Only treat this as a warning since the readings may be sent in a different order.
					errMsg = 'The current reading startTime is not after the previous reading\'s end time. Note this is treated only as a warning since readings may be sent out of order. ';
				}
			}
		}
		if ((readingOK && isAscending && Math.abs(startTimestamp.diff(prevReading.endTimestamp)) > msTgap)
			|| (readingOK && !isAscending && Math.abs(endTimestamp.diff(prevReading.startTimestamp)) > msTgap)) {
			if (isCumulative) {
				/* Check if the data is in ascending order. If it is and the start time of the current reading by canonical order is not
				*  immediately after the previous reading by canonical order then there is a gap. If the gap is greater than the expected
				*  variation then OED should drop this reading.
				*
				*  If the data is in descending order and the start time of the previous reading by canonical order is not immediately after 
				*  the current reading's end time by canonical order then there is also a gap. If this gap is greater than the expected variation
				*  then OED should also drop this reading.*/
				readingOK = false;
				errMsg = 'The end of the previous reading is too far from the start of the next readings in cumulative data so drop this reading. ';
			}
			else if (!isFirst(prevReading.endTimestamp)) {
				//Only treat this as a warning since we expect a gap in the first ever reading.
				errMsg += 'There is a gap in time between this reading and the previous reading. Note this is treated only as a warning since OED expects a gap to occur in the first ever reading. ';
			}
		}
		if (readingOK) {
			// Reject negative readings
			if (isCumulative && meterReading1 < 0) {
				// If the value isCumulative and the prior reading is negative reject because OED cannot accept any negative readings
				log.error(`DETECTED A NEGATIVE VALUE WHILE HANDLING CUMULATIVE READINGS FROM METER ${meterID}, ` +
					`ROW ${index - readingRepetition}. REJECTED ALL READINGS`);
				return [];
			}
			// To handle net cumulative readings which are negative.
			if (meterReading < 0) {
				// if meterReading is negative and cumulative check that the times fall within an acceptable reset range
				if (handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp)) {
					// If there is a cumulative reset then the meterReading should always use the canonical previous raw reading value
					if (isAscending) {
						// For data which is in ascending order the canonical previous raw reading value = meterReading2;
						meterReading = meterReading2;
					}
					else {
						// For data which is in descending order the canonical previous raw reading value = meterReading1;
						meterReading = meterReading1;
					}
				}
				else {
					//cumulativeReset is not expected but there is a negative net meter reading so reject all readings.
					errMsg = ('A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.')
					log.error('Error parsing Reading #' + (index + 1) + '. Reading value of ' + meterReading2 + ' gives ' + meterReading + ' with error message: ' + '\"' + errMsg + '\"');

					return [];
				}
			}
			if (readingOK) {
				if (Math.abs(prevReading.endTimestamp.diff(prevReading.startTimestamp) - endTimestamp.diff(startTimestamp))
					> msTlen && !isFirst(prevReading.endTimestamp)) {
					errMsg = 'The previous reading has a different time length than the current reading. Note this is treated only as a warning since this may be expected for certain meters.';
					// If this is true we still add the reading to the results
				}
				if (!(errMsg === '')) {
					// There may be warnings to output even if OED accepts the readings so output all warnings which may exist
					log.warn('Warning parsing Reading #' + (index + 1) + '. Reading value gives ' + meterReading + ' with warning message: ' + '\"' + errMsg + '\"');
				}
				// This reading has passed all checks and can be added to result
				currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
				result.push(currentReading);
				if (index === rows.length - 1) {
					// Update the meter to contain information for the last reading in the data file
					meter.startTimestamp = startTimestamp;
					meter.endTimestamp = endTimestamp;
					meter.update(conn);
				}
			}
		}
		if (!readingOK) {
			// An error occurred so add it to the readings dropped array and let the client know why before continuing
			log.error('Error parsing Reading #' + (index + 1) + '. Reading value gives ' + meterReading + ' with error message: ' + '\"' + errMsg + '\"');
			readingOK = true;
			// index-readingReptition = reading # dropped in the data
			readingsDropped.push(index + 1);
			/* If the data is cumulative then regardless of if it comes with end timestamps only or both end timestamps and start timestamps
			*  the first reading ever should become the previous reading. This is necessary because there are no previous readings in the db
			*  yet so we must drop the first point ever and use this first point as the first previous reading in order to begin calculating
			*  net readings since the data is cumulative.
			*
			*  If the data is not cumulative but there are only end timestamps then we still must drop the first reading ever in order to use
			*  that reading as the first start timestamp for the next reading. All following readings can then use the previous end timestamps
			*  as the current readings start timestamp until all further readings have been processed.*/
			if (isCumulative && !onlyEndTime || !isCumulative && onlyEndTime || isCumulative && onlyEndTime) {
				currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
				// This currentReading will become the previousReading for the first reading if isCumulative is true
			}
		}
		prevReading = currentReading;
	}
	if (conditionSet !== undefined && !validateReadings(result, conditionSet)) {
		log.error(`REJECTED ALL READINGS FROM METER ${ipAddress} DUE TO ERROR WHEN VALIDATING DATA`);
		return null;
	}
	// Let the user know exactly which readings were dropped if any before continuing
	readingsDropped.forEach(readingNum => log.info('Dropped Reading #' + readingNum));
	return result;
}

/**
 * @param {moment} t moment date/time to compare against the first ever possible moment date/time which may exist
 */
function isFirst(t) {
	return t.isSame(E0);
}

module.exports = processData;