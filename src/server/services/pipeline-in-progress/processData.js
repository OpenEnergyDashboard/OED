/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment-timezone');
const { log } = require('../../log');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const handleCumulativeReset = require('./handleCumulativeReset');
const { validateReadings } = require('./validateReadings');
const { TimeSortTypesJS } = require('../csvPipeline/validateCsvUploadParams');
const { meterTimezone } = require('../meterTimezone');

// The default start/end timestamps that are set to the first
// day of time in moment. As always, we want to use UTC.
const E0 = moment(0).utc()

/**
 * Handle all data, assume that the first row is the first reading if increasing and last is first reading if decreasing.
 * @Example
 * 	row 0: reading #0
 *  row 1: reading #1
 * 	row 2: reading #2
 * => reading #1 = row 1
 *    reading #2 = row 2
 *    If cumulative then reading #0 is either calculated value from the last reading from last previous upload or will be dropped.
 * @param {object[[]]} rows array of readings where each index is in the format [reading, startTime, endTime] where date/time is
 *   either a string or a Moment. Note the start/endTime
 *   are actually date/time where you cannot have the day of month first in date. This is what moment can deal with.
 *   No start time if isEndOnly true.
 * @param {number} meterID meter id being input
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file 
 *   'increasing' or 'decreasing'), default 'increasing'
 * @param {number} readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on (such as E-mon D-mon meters)
 * @param {boolean} isCumulative true if the data is cumulative and false otherwise
 * @param {boolean} cumulativeReset true if the cumulative data can reset and false otherwise
 * @param {string} resetStart a string representation in the format "HH:mm:ss.SSS" which represents the start time a cumulativeReset may occur after.
 *    The :ss.SSS can be left off. The default resetStart time is '00:00:00.000'
 * @param {string} resetEnd a string which represents the end time a cumulativeReset may occur before in same format as resetStart.
 *  The default resetEnd time is '23:59:99.999'
 * @param {number} readingGap the allowed time variation in seconds that a gap may occur between two readings, default 0
 * @param {number} readingLengthVariation the allowed time variation in seconds that two readings may deviate in time
 *   length from each other, default 0
 * @param {boolean} isEndTime true if the data only has an endTimestamp, default false. If true then each index in row only has start timestamp.
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn the connection to the database
 * @param {boolean} honorDst true if this meter's times shift when crossing DST, false otherwise (default false)
 * @param {boolean} relaxedParsing true if the parsing of readings allows for non-standard formats, default if false since this can give bad dates/times.
 * @param {boolean} useMeterZone true if the readings are switched to the time zone (meter then site then server)), default if false.
 *   Should only be true if honorDST is true and reading does not have proper time zone information. This feature is not great and should
 *   be avoided except in special circumstances.
 * @returns {object[]} {array of readings accepted, true if all readings accepted and false otherwise, all messages from processing}
 */
async function processData(rows, meterID, timeSort = TimeSortTypesJS.increasing, readingRepetition, isCumulative, cumulativeReset,
	resetStart = '00:00:00.000', resetEnd = '23:59:99.999', readingGap = 0, readingLengthVariation = 0, isEndTime = false,
	conditionSet, conn, honorDst = false, relaxedParsing = false, useMeterZone = false) {
	// Holds all the warning message to pass back to inform user.
	// Note they use basic HTML because the messages can be long/complex and it was felt it would be easy to put it into a web browser
	// to make them easier to read.
	let msgTotal = '';
	// Tells if already passed total message length allowed so msgTotal is truncated.
	let msgTotalWarning = false;
	// If all readings were accepted or not.
	let isAllReadingsOk = true;
	// If processData is successfully finished then return result = [R0, R1, R2...RN]
	const result = [];
	// Tell all readings that will not be added to DB.
	const readingsDropped = [];
	// Usually holds current message(s) that are yet to be added to msgTotal.
	let errMsg;
	// Tells sorted order of readings.
	const isAscending = (timeSort === TimeSortTypesJS.increasing);
	// Convert readingGap and readingLengthVariation to milliseconds to stay consistent with moment.diff() which returns the difference in milliseconds
	const msReadingGap = readingGap * 1000;
	const msReadingLengthVariation = readingLengthVariation * 1000;
	// The following variables are only used if honorDst is true.
	// Holds the endTimeStamp of the previous reading when we cross out of DST.
	let prevEndTimestamp;
	// Holds the original endTimestamp of readings since it is sometimes shifted.
	let origEndTimestamp;
	// Tells if processing DST data across readings.
	let inDst = false;
	// Tells if just stopped inDst with this reading.
	let inDstStop = false;
	// The start time to use for saved reading if first reading to accept after backward shift out of daylight savings time.
	let startTimestampUse;
	// Going to need to know meter timezone if honoring DST
	let meterZone;
	// The shift in time when a DST crossing occurs.
	let shift;
	// Tells if we need to split this reading.
	let splitDst = false;
	// Date/time daylight savings starts/ends when a crossing occurs.
	// The array holding this in moment-timezone is called untils.
	let zoneUntil;
	// The start and end timestamp in the timezone of the provided meter.
	// Retrieve and set the last reading and info stored for the meter
	// TODO We have an issue that this will not return all the values unless admin but we have a CSV login.
	const meter = await Meter.getByID(meterID, conn);
	let meterReading = meter.reading;
	// These reading values are needed for cumulative data.
	let meterReading1 = meter.reading;
	let meterReading2 = meter.reading;
	// These are the start and end times in the timezone they were saved and in UTC.
	// Note the meter stores as a string to preserve the shift.
	// The use of timezone here is a misnomer because this is really the offset.
	// See below on why create timestamps this way.
	let startTimestampTz = moment.parseZone(meter.startTimestamp, true);
	let endTimestampTz = moment.parseZone(meter.endTimestamp, true);
	let startTimestamp = moment.parseZone(startTimestampTz.clone()).tz('UTC', true);
	let endTimestamp = moment.parseZone(endTimestampTz.clone()).tz('UTC', true);
	let meterName = meter.name;
	// These only happen if worried about DST.
	if (honorDst) {
		// Get the meter timezone since the same while processing this data.
		meterZone = await meterTimezone(meter);
		// See if were processing a shift from DST (inDst) when last batch of readings ended so need to continue.
		prevEndTimestamp = moment.parseZone(meter.previousEnd, true);
		if (!isFirst(prevEndTimestamp)) {
			// Has other value so reset to start from that point.
			// Do similar steps to below when starting inDst.
			const endTimestampMeterZone = endTimestamp.clone().tz(meterZone, true);
			zoneUntil = getZoneUntil(meterZone, endTimestampMeterZone);
			inDst = true;
		}
	}
	// To avoid mistakes, processing does not happen if cumulative reset is true but cumulative is false.
	// Note you could have an issue below if allowed this since check for reset if negative value but it
	// might be true with regular time sort.
	if (cumulativeReset && !isCumulative) {
		isAllReadingsOk = false;
		msgTotal = '<h2>On meter ' + meterName + ' in pipeline: cumulative was false but cumulative reset was true.' +
			' To avoid mistakes all reading are rejected.</h2>';
		// No readings yet so can return result
		return { result, isAllReadingsOk, msgTotal };
	}
	/* The currentReading will represent the current reading being parsed in the csv file. i.e. if index == 1, currentReading = rows[1] where
	*  rows[1] : {reading_value, startTimestamp, endTimestamp}
	*  Note that rows[1] may not contain a startTimestamp and may contain only an endTimestamp which must be reflected by
	*  onlyEndTime == True where we have,
	*  rows[1] : {reading_value, endTimestamp}
	* If dealing with decreasing timesort then rows are in the opposite order.
	*
	*  On entry there is no previousReading yet so initialize it to be the last reading received and rejected where this value is stored on
	* the meter in the database. The meter database reading value is set to a special initial date/time so we know if it should not be used.
	* After a currentReading has been processed that currentReading will become the new prevReading. For example,
	*
	*  currentReading = row[1] : {reading_value1, startTimestamp1, endTimestamp1}
	*  prevReading = row[1] : {reading_value1, startTimestamp1, endTimestamp1}
	*  currentReading = row[2] : {reading_value2, startTimestamp2, endTimestamp2}
	*  
	*  If the currentReading passes all checks then we add the currentReading to result and begin parsing and checking the next reading
	*/
	// This current reading should not be used until it is reset later with the desired reading.
	let currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
	let prevReading = currentReading;
	// For end only times, you need to know the previous start time in timezone.
	// If coming off the meter then it is UTC.
	let prevEndTimestampTz = endTimestampTz;
	// Tracks if a reading is okay to use.
	let readingOK;
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
		// Since the last readingRepetition values are the same, we can use any one we want to make the checks easier.
		startLoop = rows.length - readingRepetition;
		stepLoop = -readingRepetition;
	}
	for (let index = startLoop; continueLoop(index, isAscending, rows.length); index += stepLoop) {
		// The reading starts okay. To be safe, do it in every case.
		readingOK = true;
		// The logic generally makes it safe to set rather than accumulate the error messages.
		// However, warnings could get lost (since readingOK not false). Since accumulating
		// does not matter in many cases (errMsg is still empty) and protects against edge cases,
		// the code uses accumulation and starts empty each time through the loop.
		errMsg = '';
		// If rows already has a moment (instead of a string) this still works fine.
		// Set moment to strict mode so will give Invalid date if any issues and then decide
		// if can use more relaxed mode if that was requested.
		if (isEndTime) {
			// The startTimestamp of this reading is the endTimestamp of the previous reading.
			// See else clause for why formatted this way.
			startTimestamp = prevReading.endTimestamp;
			startTimestampTz = prevEndTimestampTz;
			if (useMeterZone) {
				// Treat the reading as if it came in the meter time zone.
				// This keeps the time the same but applies the time zone.
				endTimestampTz = moment.tz(rows[index][1], meterZone);
			} else {
				// Use whatever the reading has (UTC if none)
				endTimestampTz = moment.parseZone(rows[index][1], undefined, true);
			}
			if (!endTimestampTz.isValid() && !useMeterZone && relaxedParsing) {
				errMsg += 'The end date/time of ' + rows[index][1] + ' did not parse to a date/time using the normal format so'
					+ ' a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.<br>'
				// If this fails it is caught below.
				endTimestampTz = moment.parseZone(rows[index][1], undefined);
			}
			// Get the reading into UTC where clone so don't change the Tz one in case use later if honorDst. The date/time is
			// the same but in UTC.
			endTimestamp = moment.parseZone(endTimestampTz.clone()).tz('UTC', true);
		} else {
			// If the start date/time from the reading's timezone. Next, we put it
			// into a moment reading has a timezone offset associated with it then we want to honor it by using parseZone.
			// However the database uses UTC and has no timezone offset so we need to get the reading into UTC.
			// OED plots readings as the date/time it was acquired independent of the timezone. For example, if the reading is
			// 2021-06-01 00:00:00-05:00 then the database should store it as 2021-06-01 00:00:00.
			// Thus, we want in a timezone aware way so the UTC sticks and there is no shift of time.
			// This setup should work no matter want the timezone is on the server.
			// Get the reading into moment in a timezone aware way. Note will assume UTC if no timezone in the string.
			if (useMeterZone) {
				// Treat the reading as if it came in the meter time zone.
				// This keeps the time the same but applies the time zone.
				startTimestampTz = moment.tz(rows[index][1], meterZone);
			} else {
				// Use whatever the reading has (UTC if none)
				startTimestampTz = moment.parseZone(rows[index][1], undefined, true);
			}
			if (!startTimestampTz.isValid() && !useMeterZone && relaxedParsing) {
				// A known example where this will lead to the wrong date is if hyphens are used and it is not yyyy-mm-dd, e.g.,
				//07-06-2021. This is why the user must ask for doing relaxed parsing.
				errMsg += 'The start date/time of ' + rows[index][1] + ' did not parse to a date/time using the normal format so'
					+ ' a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.<br>'
				// If this fails it is caught below.
				startTimestampTz = moment.parseZone(rows[index][1], undefined);
			}
			if (useMeterZone) {
				// Treat the reading as if it came in the meter time zone.
				// This keeps the time the same but applies the time zone.
				endTimestampTz = moment.tz(rows[index][2], meterZone);
			} else {
				// Use whatever the reading has (UTC if none)
				endTimestampTz = moment.parseZone(rows[index][2], undefined, true);
			}
			if (!endTimestampTz.isValid() && !useMeterZone && relaxedParsing) {
				errMsg += 'The end date/time of ' + rows[index][2] + ' did not parse to a date/time using the normal format so'
					+ ' a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.<br>'
				// If this fails it is caught below.
				endTimestampTz = moment.parseZone(rows[index][2], undefined);
			}
			// Get the reading into UTC where clone so don't change the Tz one in case use later if honorDst. The date/time is
			// the same but in UTC.
			startTimestamp = moment.parseZone(startTimestampTz.clone()).tz('UTC', true);
			endTimestamp = moment.parseZone(endTimestampTz.clone()).tz('UTC', true);;
		}
		if (startTimestamp.format() === 'Invalid date' || endTimestamp.format() === 'Invalid date') {
			errMsg += 'For meter ' + meterName + ': Error parsing Reading #' + row(index, isAscending, rows.length) +
				' The start (' + rows[index][1] + ') and/or end time (' + rows[index][2] +
				') provided did not parse into a valid date/time so all reading are rejected.<br>';
			log.error(errMsg);
			// We use the current reading where provide 'unknown' for reading value since not yet set.
			// Since only output this is okay.
			errMsg += logStatus(meterName, row(index, isAscending, rows.length), prevReading,
				new Reading(meterID, 'unknown', startTimestamp, endTimestamp), timeSort, readingRepetition,
				isCumulative, cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
			({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
			// This empties the result array. Should be fast and okay with const.
			result.splice(0, result.length);
			isAllReadingsOk = false;
			return { result, isAllReadingsOk, msgTotal };
		}
		// Determine the meter reading value to use based on if the data is cumulative or not cumulative
		if (isCumulative) {
			meterReading1 = meter.reading; // In cumulative this is the canonical previous raw reading
			meterReading2 = rows[index][0]; // In cumulative this is the canonical current raw reading
			// Check the current reading is a number. The previous one should already be checked.
			if (isNaN(meterReading2)) {
				errMsg += 'For meter ' + meterName + ': Error parsing Reading #' + row(index, isAscending, rows.length) +
					' with cumulative data. The reading value provided of ' + meterReading2 +
					' is not considered a number so all reading are rejected.<br>';
				log.error(errMsg);
				msgTotal += errMsg;
				// This empties the result array. Should be fast and okay with const.
				result.splice(0, result.length);
				isAllReadingsOk = false;
				return { result, isAllReadingsOk, msgTotal };
			}
			// In cumulative the reading we use will be the difference between the current raw reading and the previous raw reading
			meterReading = meterReading2 - meterReading1;
			// Always update the meter table with the most current raw cumulative value. This means the meter on the database has the
			// cumulative value rather than the net value that is stored in the readings table. This is needed so you can use the last
			// one from a previous input as the first previous one on the next input. Note it is stored even if there are issues with
			// the readings so a future upload will see the last reading.
			meter.reading = meterReading2;
		} else {
			// The data is not cumulative use the raw reading value
			meterReading = rows[index][0];
			if (isNaN(meterReading)) {
				errMsg += 'For meter ' + meterName + ': Error parsing Reading #' + row(index, isAscending, rows.length) +
					' The reading value provided of ' + meterReading +
					' is not considered a number so all reading are rejected.<br>';
				log.error(errMsg);
				msgTotal += errMsg;
				// This empties the result array. Should be fast and okay with const.
				result.splice(0, result.length);
				isAllReadingsOk = false;
				return { result, isAllReadingsOk, msgTotal };
			}
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
			// You may get this message with the cumulative one above but that desired.
			errMsg += 'The first ever reading must be dropped when dealing only with endTimestamps.<br>';
		}

		// This next block deals with meters that use daylight savings time.
		// Note: all times are UTC except for checking if cross DST.
		if (readingOK && honorDst) {
			// We need to worry about DST.
			// Get the shift in timezone for the start and end of this reading to see if crossed DST.
			// Must do in the meter timezone and the reading must have an offset for this to work.
			shift = dstShift(startTimestampTz, endTimestampTz);
			if (shift < 0) {
				// These are the examples on the left in the example diagram in the developer docs.
				// This reading crossed and entered DST so went forward in time.
				// The startTime must be in the other side since crossed DST.
				// Find the date/time for this DST shift.
				// Since UTC does not have any DST, we need to use the meter timezone. Since OED stores the same date/time but
				// in UTC, we want the same date/time but in the local timezone without any timezone shifts so second argument is true.
				// tz mutates so make a clone.
				const endTimestampMeterZone = endTimestamp.clone().tz(meterZone, true);
				// Need the actual data/time that the DST shift occurs since what we do changes based on whether the reading is
				// within the shift or not. Note we do this inside the if since it takes a little time and not done if shift = 0
				// which is the most common case.
				zoneUntil = getZoneUntil(meterZone, endTimestampMeterZone);
				// If the end of the readings is within the shift distance of the zoneUntil time then the reading ended in the DST shift
				// and time was added to the end time of the reading.
				// In this case, we adjust the end time by the shift so it appears to have the correct amount of time. This helps avoid
				// warning/errors from the tests that follow. We want the original value to be mutated so no clone.
				// We keep a copy of the original for use in the shift.
				origEndTimestamp = endTimestamp.clone();
				if (endTimestamp.clone().add(shift, 'minutes').isBefore(zoneUntil)) {
					endTimestamp.add(shift, 'minutes');
				}
				// This is algorithm case 1 from the developer docs so we split the reading. That is done later when we add readings
				// for inclusion. Thus, we mark that a split is needed.
				splitDst = true;
			} else if (shift > 0) {
				// This is a hack where when doing meter time zone you don't do the DST processing when crossing out
				// of DST. This can give duplicate values and miss if the readings don't align with the DST shift range.
				// TODO fix this up so better.
				if (!useMeterZone) {
					// These are the examples on the right in the example diagram in the developer docs.
					// This reading crossed and left DST so went back in time.
					// The next two lines are similar use to above.
					const endTimestampMeterZone = endTimestamp.clone().tz(meterZone, true);
					zoneUntil = getZoneUntil(meterZone, endTimestampMeterZone);
					// We must not accept any reading time until it is after the previous reading end time so there is no overlap.
					// This may take multiple readings so store the time now.
					prevEndTimestamp = prevReading.endTimestamp;
					// We note we are in this situation and may need to remove and split readings.
					inDst = true;
				}
			} else {
				// Note a shift of zero means did not cross DST so just use as usual unless inDst that is
				// handled next.
				if (useMeterZone) {
					// TODO This is a big hack because we we don't do inDst for this case so reset. Similar to issue above.
					splitDst = false;
				}
			}
			if (inDst) {
				if (endTimestamp.isAfter(prevEndTimestamp)) {
					// This reading has some part of its time past the previous one used so need to use it and stop this process.
					// This R2 in 1B, Reading in 2B, R5 in 3b and R4 in 4B in the developer docs examples.
					// Start the reading at the maximum of the previous end time and the start time.
					// We do this because there might be a gap before this reading so it does not align
					// with the end of the previous reading.
					startTimestampUse = moment.max(prevEndTimestamp, startTimestamp);
					errMsg += 'This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading';
					errMsg += ' so its reading will be prorated where the original values were:';
					errMsg += ' startTimestamp of ' + startTimestampTz.format() + ' endTimestamp of ' + endTimestampTz.format() + ' reading value of ' + meterReading;
					// Prorate the reading value for the fraction of the time of the reading used.
					// If this is the reading that crossed DST then the original reading is actually one hour longer so need to add the shift.
					// If not, the shift is zero and all is okay. Use clone to avoid mutating the original.
					meterReading = prorated(startTimestamp, endTimestamp.clone().add(shift, 'minutes'), startTimestampUse, endTimestamp, meterReading);
					errMsg += '. The used part has startTimestamp of ' + startTimestampUse.format() + ' and endTimestamp of ' + endTimestamp.format() + ' and value of ' + meterReading;
					errMsg += '. This is only a notification and should not be an issue.<br>';
					// We are done processing readings in this way.
					inDst = false;
					// We need to know later that we just stopped inDst so mark.
					inDstStop = true;
				} else {
					// This is R1 in 1B, R1 & R2 & R3 & R4 in 3B, R1 & R2 & R3 in 4B in the developer docs examples.
					// This reading entirely overlaps a previous reading so it is dropped.
					readingOK = false;
					errMsg += 'This reading is entirely within the shift time from daylight savings to standard time so it is dropped.';
					errMsg += ' The dropped reading  had startTimestamp of ' + startTimestampTz.format() + ' and endTimestamp of ' + endTimestampTz.format() + ' and value of ' + meterReading;
					errMsg += '. This should not be an issue but the reading is lost.<br>';
					// Even though this reading is not okay, the next one might be the case above and if it went backward in time (the first one)
					// then the time length is off. This happens in 1B in the examples in the developer docs.
					// If we shift the end time then there will be a gap. We shift the start in this case even though the time is now off but will be dropped.
					// clone may not be needed but being careful.
					startTimestamp = startTimestamp.clone().subtract(shift, 'minutes');
				}
			}
		}
		if (readingOK && startTimestamp.isSameOrAfter(endTimestamp)) {
			readingOK = false;
			errMsg += 'The reading end time is not after the start time so we must drop the reading.';
			if (isEndTime) {
				errMsg += ' The start time came from the previous readings end time.';
			}
			errMsg += '<br>';
		}
		// Here and in a number of following cases, we don't continue processing if the reading already had error(s)
		// because that can cause issues due to bad data.
		if (readingOK) {
			// Check that startTimestamp is not before the previous endTimestamp
			if (isEndTime && endTimestamp.isSameOrBefore(prevReading.endTimestamp)) {
				readingOK = false;
				errMsg += 'The reading is not after the previous reading with only end time given so we must drop the reading.<br>';
			} else if (startTimestamp.isBefore(prevReading.endTimestamp)) {
				if (isCumulative) {
					// If start time of the current reading by canonical order is before the previous readings end time then reject
					// Because OED must subtract the previous reading value which should not be done if they are not in time order.
					readingOK = false;
					errMsg += 'The reading start time is before the previous end time and the data is cumulative so OED cannot use this reading.<br>';
				} else if (!isFirst(prevReading.endTimestamp)) {
					// Only a potential issue if not the first ever seen reading where previous end time is arbitrary.
					if (honorDst) {
						// It is possible that the gap means we missed the DST crossing. To check, we see if the start time is within the DST shift.
						const startTimestampMeterZone = startTimestamp.clone().tz(meterZone, true);
						// Need the actual data/time that the DST shift occurs since what we do changes based on whether the reading is
						// within the shift or not. Note we do this inside the if since it takes a little time and not done if shift = 0
						// which is the most common case.
						if (inZone(meterZone, startTimestampMeterZone)) {
							// Reading starts within DST shift so it might be an issue. Warn the user.
							errMsg += 'The reading start time is shifted and within the DST shift so it is possible that the crossing to standard time was missed and readings overlap. ';
						}
					}
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
		if (readingOK && isCumulative) {
			// Reject negative readings for cumulative.
			// Note one can make the case that we should accept them since we don't automatically exclude negative readings.
			// The conditionSet could be used instead to catch this if desired. However, we decided that cumulative
			// normally don't go negative so are excluding these values.
			// This could be changed by commenting out this block of code. Note that the next reading will be larger than
			// what is received since subtracting the previous negative reading if actually use it.
			if (meterReading2 < 0) {
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
				errMsg = 'For meter ' + meterName + ': ' + errMsg;
				log.error(errMsg);
				errMsg += logStatus(meterName, negRow, prevReading, logReading, timeSort, readingRepetition, isCumulative, cumulativeReset,
					resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
				({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
				// This empties the result array. Should be fast and okay with const.
				result.splice(0, result.length);
				isAllReadingsOk = false;
				return { result, isAllReadingsOk, msgTotal };
			}
			// To handle net cumulative readings which are negative.
			if (meterReading < 0) {
				// if meterReading is negative then cumulative check that the times fall within an acceptable reset range.
				// Note this will be false if not cumulative given check above that need cumulative with reset.
				if (handleCumulativeReset(cumulativeReset, resetStart, resetEnd, startTimestamp)) {
					// If there is a cumulative reset then the meterReading should always use the canonical current raw reading value.
					// This means that we assume the reading value reset at the start of the reading or some value will be lost.
					// We don't really have an alternative to doing this.
					meterReading = meterReading2;
				} else {
					//cumulativeReset is not expected but there is a negative net meter reading so reject all readings.
					errMsg += ('<br>For meter ' + meterName + ': Error parsing Reading #' + row(index, isAscending, rows.length) +
						'. Reading value of ' + meterReading2 + ' gives ' +
						meterReading + ' with error message:<br>A negative meterReading has been detected but either cumulativeReset' +
						' is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.<br>');
					log.error(errMsg);
					errMsg += logStatus(meterName, row(index, isAscending, rows.length), prevReading, logReading, timeSort, readingRepetition,
						isCumulative, cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
					({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
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
				// The usage of prevReading.startTimestamp here and prevReading.endTimestamp above is a subtle issue.
				// Above is a check if this is the first reading ever seen (this is the first upload where values might
				// be accepted). If you have end only then for the first reading you will set the start time to be the special
				// initialized time (moment(0)) and will drop that reading. Now, the next time around, it will not be the first
				// reading but the length of the previous reading will be determined using the previous start time that is
				// the special value so it isn't valid. Thus, you really have to skip this check for the first two readings
				// ever with end only and this does that. Note if it is not end only then the first reading had a valid end
				// time that will be saved so this check is not passed and you get and the desired warning.
				if (!isFirst(prevReading.startTimestamp)) {
					errMsg += 'The previous reading has a different time length than the current reading and exceeds the tolerance of ' +
						msReadingLengthVariation / 1000 +
						' seconds. Note this is treated only as a warning since this may be expected for certain meters.<br>';
					// If this is true we still add the reading to the results
				}
			}
			// This reading has passed all checks and can be added to result

			// The processing of DST crossing above found that we need to split this reading.
			// This is part of case 1 of the algorithm in the developer's documentation.
			if (splitDst) {
				// When we prorate the value it is always with one less hour due to DST shift.
				let shiftedEndTimestamp = origEndTimestamp.clone().add(shift, 'minutes');
				// We need to split the reading into two readings to remove the time in the DST shift.
				// The first part goes until where the shift starts. Since moment-timezone gives the end of the shift
				// we need to add the shift (which is negative) to get to that time.
				// add mutates so clone.
				let readingOneEndTimestamp = zoneUntil.clone().add(shift, 'minutes');
				// Check to make sure there is any time in this first part.
				if (readingOneEndTimestamp.isAfter(startTimestamp)) {
					// The reading has some time associated with the first split so use.
					// We need to prorate the value for the fraction of time it uses compared to the full time. This uses the shifted end time.
					let readingOneValue = prorated(startTimestamp, shiftedEndTimestamp, startTimestamp, readingOneEndTimestamp, meterReading);
					// startTimestamp is modified below so we clone it here so the value in the array is not impacted.
					let readingOne = new Reading(meterID, readingOneValue, startTimestamp.clone(), readingOneEndTimestamp);
					// If we changed the endTimestamp to avoid length issues earlier, we now put it back because we need the actual end time
					// so the next reading does not see a gap. subtract mutates endTimestamp as desired. This also gets the right value in the messages.
					// We do this after the proration so it is the correct length.
					errMsg += 'Reading #' + row(index, isAscending, rows.length) + ' crossed into daylight savings so it needs to be split where the first part is now being used.';
					errMsg += ' The original reading had ';
					errMsg += 'startTimestamp of ' + startTimestampTz.format() + ' endTimestamp of ' + endTimestampTz.format() + ' reading value of ' + meterReading;
					errMsg += ' and the first part has a startTimestamp of ' + startTimestamp.format() + ' endTimestamp of ' + readingOneEndTimestamp.format();
					errMsg += ' reading value of ' + readingOneValue;
					errMsg += '. This is only a notification and should not be an issue.<br>';
					// May not always be needed but clone so any changes in the timestamps do not change ones put in result.
					result.push(readingOne.clone());
				}
				// The second part starts at the end of the DST shift which is what moment returns. Notice this is shift time later than
				// the end time of the first part.
				let readingTwoStartTimestamp = zoneUntil;
				// Check to make sure there is any time in this first part.
				if (origEndTimestamp.isAfter(readingTwoStartTimestamp)) {
					// The reading has some time associated with the second split so use.
					// We need to prorate the value for the fraction of time it uses compared to the full time. This uses the shifted end time.
					let readingTwoValue = prorated(startTimestamp, shiftedEndTimestamp, readingTwoStartTimestamp, origEndTimestamp, meterReading);
					let readingTwo = new Reading(meterID, readingTwoValue, readingTwoStartTimestamp, origEndTimestamp);
					errMsg += 'Reading #' + row(index, isAscending, rows.length) + ' crossed into daylight savings so it needs to be split where the second part is now being used.';
					errMsg += ' The original reading had';
					// Since we added the shift to the end time we now subtract to put back the original value.
					errMsg += ' startTimestamp of ' + startTimestampTz.format() + ' endTimestamp of ' + endTimestampTz.format() + ' reading value of ' + meterReading;
					errMsg += ' and the second part has a startTimestamp of ' + readingTwoStartTimestamp.format() + ' endTimestamp of ' + origEndTimestamp.format();
					errMsg += ' reading value of ' + readingTwoValue;
					errMsg += '. This is only a notification and should not be an issue.<br>';
					// May not always be needed but clone so any changes in the timestamps do not change ones put in result.
					result.push(readingTwo.clone());
				}
				// Since in UTC, the length of the reading is wrong if endTimestamp was shifted by DST shift. This does not happen if the end time was
				// outside the shift zone. If needed, we shift the start by the shift amount to avoid variation in length warning on the next reading.
				// This is used for messages and previous and will now use the adjusted values.
				if (!origEndTimestamp.isSame(endTimestamp)) {
					startTimestamp.subtract(shift, 'minutes')
				}
				currentReading = new Reading(meterID, meterReading, startTimestamp, origEndTimestamp);
				// Remove that in DST split since done processing this reading and don't want for next one.
				splitDst = false;
			} else if (inDstStop) {
				// This start timestamp from reading in inDst where it is stopping since just accepted a reading.
				// We could not reset before now since it would potentially create a gap and different length.
				currentReading = new Reading(meterID, meterReading, startTimestampUse, endTimestamp);
				// May not always be needed but clone so any changes in the timestamps do not change ones put in result.
				result.push(currentReading.clone());
				// Reset inDstStop
				inDstStop = false;
				// We reset the start timestamp for the same issue with next reading.
				currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
				// Reset back to default so if store into DB know not in DST shift zone.
				// clone() may not be needed but being safe.
				prevEndTimestamp = E0.clone();
			} else {
				currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
				// May not always be needed but clone so any changes in the timestamps do not change ones put in result.
				result.push(currentReading.clone());
			}
			if (!(errMsg === '')) {
				// There may be warnings to output even if OED accepts the readings so output all warnings which may exist
				errMsg = '<br>For meter ' + meterName + ': Warning parsing Reading #' + row(index, isAscending, rows.length) + '. Reading value gives ' +
					meterReading + ' with warning message:<br>' + errMsg;
				log.warn(errMsg);
				errMsg += logStatus(meterName, row(index, isAscending, rows.length), prevReading, currentReading, timeSort, readingRepetition,
					isCumulative, cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
				({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
			}
		} else {
			// An error occurred so add it to the readings dropped array and let the client know why before continuing.
			/* If the data is cumulative then regardless of if it comes with end timestamps only or both end timestamps and start timestamps
			*  the first reading ever should become the previous reading. This is necessary because there are no previous readings in the DB
			*  yet so we must drop the first point ever and use this first point as the first previous reading in order to begin calculating
			*  net readings since the data is cumulative.
			*
			*  If the data is not cumulative but there are only end timestamps then we still must drop the first reading ever in order to use
			*  that reading as the first start timestamp for the next reading. All following readings can then use the previous end timestamps
			*  as the current readings start timestamp until all further readings have been processed.
			*
			* Overall, this means that only when it is not cumulative and you have both start & end timestamp then if the reading has an error
			* you don't use it for the next previous reading. In this case you will get the messages about time gap and length.
			*
			* Below prevReading becomes currentReading so the change will happen.
			*/
			// These cases did not set currentReading so do that now.
			currentReading = new Reading(meterID, meterReading, startTimestamp, endTimestamp);
			// }
			errMsg = '<br>For meter ' + meterName + ': Error parsing Reading #' + row(index, isAscending, rows.length) +
				'. Reading value gives ' + meterReading + ' with error message:<br>' + errMsg;
			log.error(errMsg);
			errMsg += logStatus(meterName, row(index, isAscending, rows.length), prevReading, currentReading, timeSort, readingRepetition,
				isCumulative, cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, isEndTime) + '<br>';
			({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
			// This will let the calling functions know that some reading(s) were not used.
			isAllReadingsOk = false;
			readingsDropped.push(row(index, isAscending, rows.length));
		}
		// Always use the last reading as the next previous one so even if dropped it won't mess up the time ordering for next reading.
		// See above where may not have reset current so there actually is no change.
		prevReading = currentReading;
		// For daylight savings when end only, we need the previous reading start time in TZ for the next reading.
		// Not used in many cases but just set since easier.
		prevEndTimestampTz = endTimestampTz;
	}
	// Validate data if conditions given
	if (conditionSet !== undefined && !conditionSet['disableChecks']) {
		const { validReadings, errMsg: newErrMsg } = validateReadings(result, conditionSet, meterName);
		({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, newErrMsg, msgTotalWarning));
		if (!validReadings) {
			errMsg = `<h2>For meter ${meterName}: error when validating data so all reading are rejected</h2>`;
			log.error(errMsg);
			({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, errMsg, msgTotalWarning));
			// This empties the result array. Should be fast and okay with const.
			result.splice(0, result.length);
			isAllReadingsOk = false;
			return { result, isAllReadingsOk, msgTotal };
		}
	}
	// Update the meter to contain information for the last reading in the data file.
	// Note this means that even if the last value was rejected we still store it as
	// the next previous reading. This is probably a good idea, in general, but it is
	// possible an undesirable time is saved at points. This will lead to messages on
	// the next upload. Also note that the update does not happen if all the values
	// are rejected as a batch (so return before this point).
	// We need to set this as a string to preserve the time shift info.
	meter.startTimestamp = startTimestampTz.format('YYYY-MM-DD HH:mm:ssZ');
	meter.endTimestamp = endTimestampTz.format('YYYY-MM-DD HH:mm:ssZ');
	// Make sure previousEnd is updated.
	meter.previousEnd = prevEndTimestamp;
	await meter.update(conn);
	// Let the user know exactly which readings were dropped if any before continuing and add to the total messages.
	if (readingsDropped.length !== 0) {
		({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, '<h2>Readings Dropped and should have previous messages</h2><ol>', msgTotalWarning));
		readingsDropped.forEach(readingNum => {
			let messageNew = '<li>Dropped Reading #' + readingNum + ' for meter ' + meterName + '</li>'; log.info(messageNew);
			({ msgTotal, msgTotalWarning } = appendMsgTotal(msgTotal, messageNew, msgTotalWarning));
		});
		// Assume the <ol> was put in. If not, get minor HTML syntax issue.
		msgTotal += '</ol>';
	}
	return { result, isAllReadingsOk, msgTotal };
}

/**
 * Generally used to see if a reading is the initial value stored in the DB for date/time to know if you are
 * working with this special reading.
 * @param {moment} t moment date/time to compare against the first ever possible moment date/time which may exist
 */
function isFirst(t) {
	return t.isSame(E0);
}

/**
 * Tell if the main for loop should continue. It is used to figure out the different
 * time sort cases.
 * @param index the current index of the loop
 * @param isAscending true if rows are chronologically increasing and false if reverse
 * @param length the total number of rows
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

/**
 * Converts the loop index into a reading row. This is needed because the data is processed in different
 * orders depending on the time sort so the index and rows may go in different directions.
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
 * Logs information about pipeline where parameters are all the current information.
 * This is normally done right after something was logged to give more context.
 * Note that the logging sometimes puts the output a little earlier/later when there are
 * multiple messages. It seems to be something about the logging and not looked into.
 * There are a lot of parameters that are the values to be displayed.
 * @returns {string} The message just logged.
 */
function logStatus(meterName, rowNum, prevReading, currentReading, timeSort, readingRepetition, isCumulative,
	cumulativeReset, resetStart, resetEnd, readingGap, readingLengthVariation, onlyEndTime) {
	let message = 'For reading #' + rowNum + ' on meter ' + meterName + ' in pipeline: ' + 'previous reading has value ' + prevReading.reading + ' start time '
		+ prevReading.startTimestamp.format() + ' end time ' + prevReading.endTimestamp.format() + ' and current reading has value '
		+ currentReading.reading + ' start time ' + currentReading.startTimestamp.format() + ' end time ' + currentReading.endTimestamp.format()
		+ ' with timeSort ' + timeSort + '; duplications ' + readingRepetition + '; cumulative ' +
		isCumulative + '; cumulativeReset ' + cumulativeReset + '; cumulativeResetStart ' + resetStart + '; cumulativeResetEnd ' + resetEnd +
		'; lengthGap ' + readingGap + '; lengthVariation ' + readingLengthVariation + '; onlyEndTime ' + onlyEndTime;
	log.info(message);
	return message;
}

/**
 * Updates the string with all messages as long as it does not exceed the max size. This stops the returned message
 * from becoming too long.
 * @param {string} msgTotal The current total message to be add to
 * @param {string} newMsg The new message to append
 * @param {boolean} msgTotalWarning false if have not yet exceeded the allowed message size and true otherwise.
 * @returns {object[]} {the updated message, update message warning}
 */
function appendMsgTotal(msgTotal, newMsg, msgTotalWarning) {
	// The limit to number of characters in the msgTotal.
	// Each message with the reading info is in the 1k byte range. If limit to 75K
	// then get around 75+ messages and that seems good without being too large a
	// return message.
	// Note that at this time we are not limiting the messages that are logged.
	// This means the log file could get large if a lot of bad points are sent.
	const MAX_SIZE = 75000;
	if (msgTotal.length < MAX_SIZE) {
		msgTotal += newMsg;
	} else if (!msgTotalWarning) {
		msgTotal = '<h1>WARNING - The total number of messages was stopped due to size.' +
			' The log file has all the messages.</h1>' + message + '<h1>Message lost starting now.</h1>';
		// Note that warned so goes from false to true.
		msgTotalWarning = !msgTotalWarning;
	}
	return { msgTotal, msgTotalWarning };
}

/**
* Determines if a reading crossed daylight savings time by seeing if the offset changes.
* Returns the minutes of that shift if crossed and zero otherwise. It crosses if the start
* and end times cross DST. If the return value is positive then the second reading just entered
* standard time/left DST and it is negative when the second reading just entered DST/left standard time.
* This assumes there is no valid reason for the offset to change except for DST. It only works if readings
* have offsets. If not/in UTC then always returns zero.
* @param {Moment} startTimestamp The start timestamp of the reading to use.
* @param {Moment} endTimestamp The end timestamp of the reading to use.
* @returns {number} the time shift between the first and second reading in minutes where it is 0 if none. 
*/
function dstShift(startTimestamp, endTimestamp) {
	const startOffset = startTimestamp.utcOffset();
	const endOffset = endTimestamp.utcOffset();
	return startOffset - endOffset;
}

/**
* Returns the reading value for the change in time length which is prorated by time length.
* @param startTimestamp The start of the original reading
* @param endTimestamp The end of the original reading
* @param newStartTime The startTimestamp of the adjusted reading time
* @param newEndTime The endTimestamp of the adjusted reading time
* @returns prorated reading value
*/
function prorated(startTimestamp, endTimestamp, newStartTime, newEndTime, meterReading) {
	// Scales the meter reading by the ratio of the new time length to the original time length.
	// For example, if it was originally 30 minutes but you are only using 15 of those minutes
	// then you scale by 15 / 30 = 0.5.
	return (newEndTime.diff(newStartTime)) / (endTimestamp.diff(startTimestamp)) * meterReading;
}

/**
* Returns a timestamp for a DST crossing that is before the pastCrossingTimestamp.
* This uses moment-timezone which gives the time after the crossing when going from DST
* to standard time, e.g., 3:00 in the U.S. on the day standard time begins. For going to
* DST it also gives the start of the shift time but that is 1:00 in the U.S. when DST begins.
* @param meterZone A string representing the timezone of the meter.
* @param pastCrossingTimestamp A timestamp that is after the crossing of DST in the meter's timezone.
* @returns A timestamp where the DST crossing occurs.
*/
function getZoneUntil(meterZone, pastCrossingTimestamp) {
	// Get the zone structure from moment for the meter's timezone.
	zone = moment.tz.zone(meterZone);
	// moment returns an array that holds the shifts for many years in the past and future.
	// Loop over array until find the one needed.
	for (let i = 0; i < zone.untils.length; i++) {
		if (moment.tz(zone.untils[i], meterZone).isAfter(pastCrossingTimestamp)) {
			// We just went past the desired one so back up one index.
			// We first want to know in the meter timezone and then we want that date/time in UTC without a shift.
			return moment.tz(zone.untils[i - 1], meterZone).utc(true);
		}
	}
	// We really don't expect to not find the date desired. If this happens then throw an error.
	throw new Error('Could not find DST crossing date in pipeline so giving up.');
}

/**
* Returns true if timestamp is within a DST crossing and false otherwise.
* It is designed to check for going backward in time with a gap.
* @param meterZone A string representing the timezone of the meter.
* @param timestamp A timestamp
* @returns true if timestamp is within a DST crossing and false otherwise.
*/
function inZone(meterZone, timestamp) {
	// Get the zone structure from moment for the meter's timezone.
	zone = moment.tz.zone(meterZone);
	// moment returns an array that holds the shifts for many years in the past and future.
	// Loop over array until find the one needed.
	for (let i = 0; i < zone.untils.length; i++) {
		if (moment.tz(zone.untils[i], meterZone).isSameOrAfter(timestamp)) {
			// We just went past the the one for timestamp.
			// We see if the timestamp is within the shift of this one.
			const shift = zone.offsets[i - 1] - zone.offsets[i];
			const timestampUTC = timestamp.clone().tz('UTC', true);
			const zoneUntil = moment.parseZone(moment.tz(zone.untils[i], meterZone)).tz('UTC', true);
			if (timestampUTC.isSameOrAfter(zoneUntil) && timestampUTC.isBefore(zoneUntil.clone().add(shift, 'minutes'))) {
				// The timestamp lies within the DST shift so may be an issue.
				return true;
			} else {
				// The timestamp is not within the DST shift so it is OK.
				return false;
			}
		}
	}
	// We really don't expect to not find the date desired. If this happens then throw an error.
	throw new Error('Could not find DST crossing date in pipeline so giving up.');
}

module.exports = processData;
