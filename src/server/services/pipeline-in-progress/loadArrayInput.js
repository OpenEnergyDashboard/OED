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
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the data file
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {boolean} isCumulative true if the given data is Cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {time} cumulativeResetStart defines the first time a cumulative reset is allowed
 * @param {time} cumulativeResetEnd defines the last time a cumulative reset is allowed
 * @param {number} readingGap defines how far apart (end time of previous to start time of next) that a pair of reading can be
 * @param {number} readingLengthVariation defines how much the length of a pair of readings can vary in seconds.
 * @param {boolean} isEndOnly true if the given data only has final reading date/time and not start date/time
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn connection to database
 */
async function loadArrayInput(dataRows, meterID, mapRowToModel, timeSort, readingRepetition, isCumulative,
	cumulativeReset, cumulativeResetStart, cumulativeResetEnd, readingGap, readingLengthVariation, isEndOnly,
	conditionSet, conn) {
	readingsArray = dataRows.map(mapRowToModel);

	// TODO: Need to implement interface to let user pass in the following params to the pipeline

	// Temporary values for params. Note they are currently initialized to their default values.
	// end of temporary values for params
	readingsArray = await processData(readingsArray, meterID, timeSort, readingRepetition, isCumulative, cumulativeReset,
		cumulativeResetStart, cumulativeResetEnd, readingGap, readingLengthVariation, isEndOnly, conditionSet, conn);

	return await Reading.insertOrIgnoreAll(readingsArray, conn);
}

module.exports = loadArrayInput;
