/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const processData = require('./processData');
/**
 * Select and process needed values from a matrix and return an array of reading value and reading time
 * @param {object[[]]} dataRows where each row is defined by mapRowToModel function
 * @param {number} meterID meter id being input
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} isCumulative true if the given data is Cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn connection to database
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file
 */
async function loadArrayInput(dataRows, meterID, mapRowToModel, isCumulative, cumulativeReset, readingRepetition, conditionSet, conn, timeSort) {
	readingsArray = dataRows.map(mapRowToModel);

	// TODO: Need to implement interface to let user pass in the following params to the pipeline

	// Temporary values for params. Note they are currently initialized to their default values.
	// onlyEndtime is true if the readings have only endTimestamps. This is false by default.
	let onlyEndTime = false;
	// time in seconds that a gap may occur between two readings. This is 0 seconds by default since we expect data to not have gaps.
	let Tgap = 0;
	// time in seconds that two readings may differ from one another.
	// This is 0 seconds by default since we expect meter readings to be recorded in the same time intervals.
	let Tlen = 0;
	// time in format HH:mm:ss.SSS that a cumulative reset may begin.
	// This is '00:00:00.000' by default which means a cumulative reset may begin at the very beginning of any given day.
	let resetStart = '00:00:00.000';
	// time in format HH:mm:ss.SSS that a cumulative reset may end.
	// This is '23:59:99.999' by default which means a cumulative reset may NOT occur after .001 milliseconds till the end of any given day.
	let resetEnd = '23:59:99.999';
	// end of temporary values for params
	readingsArray = await processData(readingsArray, meterID, isCumulative, cumulativeReset, resetStart, resetEnd, 
								readingRepetition, onlyEndTime, Tgap, Tlen, timeSort, conditionSet, conn);

	return await Reading.insertOrIgnoreAll(readingsArray, conn);
}

module.exports = loadArrayInput;
