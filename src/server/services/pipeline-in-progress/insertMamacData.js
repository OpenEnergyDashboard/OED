/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const Reading = require('../../models/Reading');
const loadCsvInput = require('./loadCsvInput');

/**
 * Returns a promise to insert readings from a MAMAC csv file with the given path into the database
 *
 * Uses a long-running transaction to send information to the database and discard it as soon as possible.
 * @param {string} filePath path to file to load including file name
 * @param {Meter} meter the meter id to associate the readings with
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} readAsStream true if prefer to read file as CSV stream
 * @param {boolean} isCumulative true if the given data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {time} cumulativeResetStart defines the first time a cumulative reset is allowed
 * @param {time} cumulativeResetEnd defines the last time a cumulative reset is allowed
 * @param {number} readingGap defines how far apart (end time of previous to start time of next) that a pair of reading can be
 * @param {number} readingLengthVariation defines how much the length of a pair of readings can vary in seconds.
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {string} timeSort the canonical order sorted by date/time in which the data appears in the CSV file
 * @param {boolean} headerRow true if the given file has a header row
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, threshold, maxError)
 * @param {array} conn connection to database
 * @return {Promise.<>}
 */
function insertMamacData(filePath, meter, readingDuration, conn) {
	return loadCsvInput(filePath = filePath,
						meterID = meter.id,
						mapRowToModel = row => {
							const readRate = row[0];
							// Mamac timestamps look like 11:00:00 7/31/16
							const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
							const startTimestamp = moment(endTimestamp).subtract(readingDuration);
							return [readRate, startTimestamp, endTimestamp];
						},
						readAsStream = true,
						isCumulative = false,
						cumulativeReset = false,
						// No cumulative reset so dummy times.
						'0:00:00',
						'0:00:00',
						// Every reading should be adjacent (no gap)
						0,
						// Every reading should be the same length
						0,
						readingRepetition = 1,
						'increasing',
						headerRow = false,
						conditionSet = undefined,
						conn = conn);
}

module.exports = insertMamacData;
