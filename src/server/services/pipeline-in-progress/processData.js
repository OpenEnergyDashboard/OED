/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { log } = require('../../log');
const Reading = require('../../models/Reading');
const handleCumulativeReset = require('./handleCumulativeReset');


/**
 * Handle all data, assume that the first row is the first reading (skip this row).
 * @Example
 * 	row 0: reading #0
 *  row 1: reading #0 + #1
 * 	row 2: reading #0 + #1 + #2
 * => reading #1 = row 1 - row 0
 *    reading #2 = row 2 - row 1
 *    reading #0 is cumulative value from unknown readings that may or may not have been inserted before
 * @param {object[[]]} rows
 * @param {number} meterID
 * @param {boolean} isCumulative true if the data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data can reset
 * @param {string} resetStart a string representation of the start time a cumulativeReset may occur after. The default resetStart time is 0:00:00
 * @param {string} resetEnd a string representation of the end time a cumulativeReset may occur before. The default resetEnd time is 23:59:99
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} onlyEndTime true if the data only has an endTimestamp
 * @param {number} Tgap the allowed time variation in millisecond that a gap may occur between two readings 
 * @param {number} Tlen the allowed time variation in milliseconds that two readings may deviate from each other
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 */

function processData(rows, meterID, isCumulative, cumulativeReset, resetStart="0:00:00", resetEnd="23:59:99", readingRepetition, onlyEndTime, Tgap, Tlen, conditionSet) {

    // If we can successfully processData return result = [R0, R1, R2...RN]
	const result = [];

    let errMsg = "";

	let meterReading = 0;
	let meterReading1 = 0;
	let meterReading2 = 0;

	let startTimestamp = moment(0);
	let endTimestamp = moment(0);

	let currentReading = new Reading(meterID, -1,  startTimestamp, endTimestamp);
	let prevReading = currentReading;
	let readingOK = true;
	for (let index = readingRepetition; index <= rows.length; ++index) {
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if ((index - readingRepetition) % readingRepetition === 0) {
			if (onlyEndTime){
				// The startTimestamp of this reading is the endTimestamp of the previous reading
				startTimestamp = prevReading.endTimestamp;
				endTimestamp = moment(rows[index-readingRepetition][1], ['YYYY/MM/DD HH:mm','MM/DD/YYYY HH:mm']);
			}
			else{
				startTimestamp = moment(rows[index-readingRepetition][1], ['YYYY/MM/DD HH:mm','MM/DD/YYYY HH:mm']);
				endTimestamp = moment(rows[index-readingRepetition][2], ['YYYY/MM/DD HH:mm','MM/DD/YYYY HH:mm']);
			}
            if (isCumulative && isFirst(prevReading.endTimestamp)){
                readingOK = false;
                errMsg = "The first reading must be dropped when dealing with cumulative data.";
            }
			if (onlyEndTime && isFirst(prevReading.endTimestamp)){
				readingOK = false;
				errMsg = "The first reading must be dropped when dealing only with endTimestamps.";
			}
            if (readingOK && startTimestamp.isSameOrAfter(endTimestamp)){
				readingOK = false;	
				errMsg = "The reading end time is not after the start time.";
				if (onlyEndTime){
					errMsg += " The start time came from the previous readings end time.";
				}
			}
			if (readingOK){
				// Check that startTimestamp is not before the previous endTimestamp
				if (onlyEndTime && endTimestamp.isSameOrBefore(prevReading.endTimestamp)){
					readingOK = false;
					errMsg = "The reading is not after the previous reading with only end time given so we must drop the reading.";
				}
				else if (startTimestamp.isBefore(prevReading.endTimestamp)){
					if (isCumulative){
						readingOK = false;
						errMsg = "The reading start time is before the previous endTime and cumulative so OED cannot use this reading."
					}
					else if (! isFirst(prevReading.endTimestamp)){
						//Only treat this as a warning since the readings may be sent in a different order.
						errMsg = "The current reading startTime is not after the previous reading's end time. This is expected on the first reading ever.";
					}
				}
			}
			if (readingOK && Math.abs(startTimestamp.diff(prevReading.endTimestamp)) > Tgap){
				if (isCumulative){
					readingOK = false;
					errMsg = "The end of the previous reading is too far from the start of the next readings in cumulative data so drop the readings.";
				}
				else if (! isFirst(prevReading.endTimestamp)){
					//Only treat this as a warning since we expect a gap in the first ever reading.
					errMsg = "There is a gap in time between this reading and the previous reading.";
				}
			}
			if (readingOK){
				//This reading can be used
				if (isCumulative){
					meterReading1 = rows[index - 2*readingRepetition][0]; // use this if regular
					meterReading2 = rows[index - readingRepetition][0];
					meterReading = meterReading2 - meterReading1; // use this ifCumulative
				}
				else{
					meterReading = rows[index-readingRepetition][0];
				}
				// Reject negative readings
				if (isCumulative && meterReading1 < 0) {
					// If the value isCumulative and the first reading is negative reject unless cumulativeReset is true
					log.error(`DETECTED A NEGATIVE VALUE WHILE HANDLING CUMULATIVE READINGS FROM METER ${meterID}, ` +
						`ROW ${index - readingRepetition}. REJECTED ALL READINGS`);
					return [];
				}
				// To handle cumulative readings that resets at midnight
				if (meterReading < 0) {
					// if meterReading is negative and cumulative check that the times fall within an acceptable reset range
					if (handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp)){
						meterReading = meterReading2;
					}
					else{
						//cumulativeReset is not expected so throw an error
						errMsg = ("A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range.")
						readingOK = false;
					}
				}
				if (readingOK){
					if (Math.abs(prevReading.endTimestamp.diff(prevReading.startTimestamp)-endTimestamp.diff(startTimestamp)) > Tlen && !isFirst(prevReading.endTimestamp)){
						errMsg = "The previous reading has a different time length than the current reading.";
					}
					currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);	
					result.push(currentReading);
				}
			}
			if(!readingOK){
				// An error occurred, for now log it, let the user know and continue
				log.error(errMsg);
				readingOK = true;
				if (isCumulative && !onlyEndTime || onlyEndTime && !isCumulative || isCumulative && onlyEndTime){
					meterReading = rows[index-readingRepetition][0];
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
function isFirst(t){
	const E0 = moment(0);
	return t.isSame(E0);
}

module.exports = processData;