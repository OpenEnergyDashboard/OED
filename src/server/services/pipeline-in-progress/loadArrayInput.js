/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const { log } = require('../../log');
const processData = require('./processData');

/**
 * Select and process needed values from a matrix and insert into DB.
 * @param {object[[]]} dataRows where each row is defined by mapRowToModel function
 * @param {number} meterID meter id being input
 * @param {function} mapRowToModel a customized function that reorders each row into shape [reading_value, startTimeStamp, endTimeStamp]
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {boolean} isCumulative true if the given data is Cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {time} cumulativeResetStart defines the first time a cumulative reset is allowed
 * @param {time} cumulativeResetEnd defines the last time a cumulative reset is allowed
 * @param {number} readingGap defines how far apart (end time of previous to start time of next) that a pair of reading can be
 * @param {number} readingLengthVariation defines how much the length of a pair of readings can vary in seconds.
 * @param {boolean} isEndOnly true if the given data only has final reading date/time and not start date/time
 * @param {boolean} shouldUpdate true if new values should replace old ones, otherwise false
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn connection to database
 * @param {boolean} honorDst true if this meter's times shift when crossing DST, false otherwise (default false)
 * @param {boolean} relaxedParsing true if the parsing of readings allows for non-standard formats, default is false since this can give bad dates/times.
 * @param {boolean} useMeterZone true if the readings are switched to the time zone (meter then site then server)), default if false.
 *   Should only be true if honorDST is true and reading does not have proper time zone information.
 * @returns {object[]} {whether readings were all process (true) or false, all the messages from processing the readings as a string}
 */
async function loadArrayInput(dataRows, meterID, mapRowToModel, timeSort, readingRepetition, isCumulative,
	cumulativeReset, cumulativeResetStart, cumulativeResetEnd, readingGap, readingLengthVariation, isEndOnly,
	shouldUpdate, conditionSet, conn, honorDst, relaxedParsing, useMeterZone) {
	// Get the reading, then process them for acceptance and finally insert into the DB.
	readingsArray = dataRows.map(mapRowToModel);
	let { result: readingsToInsert, isAllReadingsOk, msgTotal } = await processData(readingsArray, meterID, timeSort, readingRepetition,
		isCumulative, cumulativeReset, cumulativeResetStart, cumulativeResetEnd, readingGap, readingLengthVariation, isEndOnly,
		conditionSet, conn, honorDst, relaxedParsing, useMeterZone);
	if (shouldUpdate) {
		// New readings should replace old ones.
		await Reading.insertOrUpdateAll(readingsToInsert, conn)
			.catch(error => {
				// DB insert failed. log it, note that processing is not okay & add to message user will get.
				log.error('loadArrayInput failed during DB inserts with updates with: ' + error.stack);
				isAllReadingsOk = false;
				msgTotal += 'Attempting to insert the readings into the database with updates failed with error: \"' + error.stack +
					'\n and the pipeline returned these messages: ' + msgTotal;
			})
	} else {
		await Reading.insertOrIgnoreAll(readingsToInsert, conn)
			.catch(error => {
				// DB insert failed. log it, note that processing is not okay & add to message user will get.
				log.error('loadArrayInput failed during DB inserts with: ' + error.stack);
				isAllReadingsOk = false;
				msgTotal += 'Attempting to insert the readings into the database failed with error: \"' + error.stack +
					'\n and the pipeline returned these messages: ' + msgTotal;
			})
	}
	return { isAllReadingsOk, msgTotal };
}

module.exports = loadArrayInput;
