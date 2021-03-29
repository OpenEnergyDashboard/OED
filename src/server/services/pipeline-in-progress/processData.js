/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { log } = require('../../log');
const Reading = require('../../models/Reading');

/**
 * Handle all data, assume that last row is the first reading (skip this row).
 * @Example
 * 	row 0: reading #0 + #1 + #2
 *  row 1: reading #0 + #1
 * 	row 2: reading #0
 * => reading #1 = row 0 - row 1
 *    reading #2 = row 1 - row 2
 *    reading #0 is cumulative value from unknown readings that may or may not have been inserted before
 * @param {object[[]]} rows
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (E-mon D-mon meters)
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {number} meterID
 */

function processData(rows, meterID, isCumulative, cumulativeReset, readingRepetition, onlyEndTime, Tgap, Tlen, conn) {

    // If we can successfully processData return result = [[V0,S0,E0],[V1,S1,E1]...[Vn,Sn,En]]
	const result = [];

    // Get all the prevReadings
    let errMsg;
	let R_ok = true;
    let R_m;
    const prevReadings = await Reading.getAllByMeterID(meterID);
    if (prevReadings.length != 0){
        // The first initial reading is the one from the Database if it exists
        R_m = prevReadings[0];
    }
    else{
        const initStartTimestamp = moment('01-01-01');
        const initEndTimestamp = moment('01-01-01');
        R_m = new Reading(meterID, initStartTimestamp, initEndTimestamp);
    }
    let R_p = R_m;

    let startTimestamp = moment(0);
    let endTimestamp = moment(0);
	let meterReading = 0;
	let meterReading1 = 0;
	let meterReading2 = 0;

	for (let index = readingRepetition; index < rows.length; ++index) {
		// To read data where same reading is repeated. Like E-mon D-mon meters
		if ((index - readingRepetition) % readingRepetition === 0) {
            // Assume reading values are in rows[index][0]
			// Assume startTimestamp is in rows[index][1]
			// Assume endTimestamp is in rows[index][2]
			// Assume if only EndTimestmap, then endTimestamp is in rows[1] 

			if (onlyEndTime){
				// The startTimestamp of this reading is the endTimestamp of the previous reading
				startTimestamp = R_p.endTimestamp;
			}
            if (isCumulative && isFirst(R_p.endTimestamp, initEndTimestamp)){
                R_ok = false;
                //console.log("startTimestamp is: ",startTimestamp.inspect(), "and prevEndTimestamp is: ", prevEndTimestamp.inspect());
                //console.log("endTimestamp is: ",endTimestamp.inspect()," and initEndTimestamp is: ",initEndTimestamp.inspect()," and index is: ",index);
                errMsg = "The first reading must be dropped when dealing with cumulative data.";
            }
            if (R_ok && startTimestamp.isSameOrAfter(endTimestamp)){
				// We should check if the start time is after the end time? Not if the start time si before the current end time since this is expected?
				R_ok = false;
				errMsg = "The reading end time is not after the start time.";
				if (onlyEndTime){
					errMsg += " The start time came from the previous readings end time.";
				}
			}
			if (R_ok){
				// Check that startTimestamp is not before the previous endTimestamp
				if (onlyEndTime && endTimestamp.isSameOrBefore(prevEndTimestamp)){
					R_ok = false;
					errMsg = "The reading is not after the previous reading with only end time given so we must drop the reading.";
				}
				else if (startTimestamp.isBefore(prevEndTimestamp)){
					// Again we should check if startTimestamp is after the endTimestamp?
					// Or we have to change the order we take in cumulative data. Currently it's coming in as newest -> oldest
					R_ok = false;
					errMsg = "The reading start time is before the previous endTime and cumulative so OED cannot use this reading."
				}
			}
			if (R_ok && Math.abs(startTimestamp.diff(prevEndTimestamp)) > Tgap){
				R_ok = false;
				errMsg = "The end of the previous reading is too far from the start of the next readings in cumulative data so drop the readings.";
			}

			// Reject negative readings
			if (meterReading1 < 0) {
				log.error(`DETECTED A NEGATIVE VALUE WHILE HANDLING CUMULATIVE READINGS FROM METER ${meterID}, ` +
					`ROW ${index - readingRepetition}. REJECTED ALL READINGS`);
				return [];
			}
			// To handle cumulative readings that resets at midnight
			if (meterReading < 0 && endTimestamp.isAfter(startTimestamp, 'date') && cumulativeReset) {
				meterReading = meterReading1;
			}
			if (R_ok){
				//This reading can be used
                // meterReading
                meterReading1 = rows[index - readingRepetition][0];
                meterReading2 = rows[index][0];
                // meterReading 1 is bigger than meterReading2
                meterReading = meterReading2 - meterReading1;
				if (Math.abs(prevEndTimestamp.diff(startTimestamp)-endTimestamp.diff(startTimestamp)) > Tlen && !isFirst(prevEndTimestamp)){
					errMsg = "The previous reading has a different time length than the current reading.";
				}	
				result.push([meterReading, startTimestamp, endTimestamp]);
			}
			else{
				// An error occurred, log it and let the user know
				log.error(errMsg);
				R_ok = true;
				// We still need to consider what to do after receiving error
			}
		}
	}
	return result;
}
function isFirst(t,E0) {
	return t.isSame(E0);
}