/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const readCsv = require('./readCsv');
const loadArrayInput = require('./loadArrayInput');
const { log } = require('../../log');

/**
 * Read a CSV file and select needed column to return an array of reading value and reading time
 * @param {string} filePath path to file to load including file name
 * @param {number} meterID meter id being input
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the CSV file
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {boolean} isCumulative true if the given data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {time} cumulativeResetStart defines the first time a cumulative reset is allowed
 * @param {time} cumulativeResetEnd defines the last time a cumulative reset is allowed
 * @param {number} readingGap defines how far apart (end time of previous to start time of next) that a pair of reading can be
 * @param {number} readingLengthVariation defines how much the length of a pair of readings can vary in seconds
 * @param {boolean} isEndOnly true if the given data only has final reading date/time and not start date/time
 * @param {boolean} headerRow true if the given file has a header row
 * @param {boolean} shouldUpdate true if new values should replace old ones, otherwise false
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, threshold, maxError)
 * @param {array} conn connection to database
 * @param {boolean} honorDst true if this meter's times shift when crossing DST, false otherwise (default false)
 * @param {boolean} relaxedParsing true if the parsing of readings allows for non-standard formats, default if false since this can give bad dates/times.
 * @param {boolean} useMeterZone true if the readings are switched to the time zone (meter then site then server)), default if false.
 *   Should only be true if honorDST is true and reading does not have proper time zone information.
 */
async function loadCsvInput(
	filePath,
	meterID,
	mapRowToModel,
	timeSort,
	readingRepetition,
	isCumulative,
	cumulativeReset,
	cumulativeResetStart,
	cumulativeResetEnd,
	readingGap,
	readingLengthVariation,
	isEndOnly,
	headerRow,
	shouldUpdate,
	conditionSet,
	conn,
	honorDst,
	relaxedParsing,
	useMeterZone
) {
	try {
		const dataRows = await readCsv(filePath, headerRow);
		return loadArrayInput(dataRows, meterID, mapRowToModel, timeSort, readingRepetition,
			isCumulative, cumulativeReset, cumulativeResetStart, cumulativeResetEnd,
			readingGap, readingLengthVariation, isEndOnly, shouldUpdate, conditionSet, conn,
			honorDst, relaxedParsing, useMeterZone);
	} catch (err) {
		log.error(`Error updating meter ${meterID} with data from ${filePath}: ${err}`, err);
	}
}

module.exports = {
	loadCsvInput
};
