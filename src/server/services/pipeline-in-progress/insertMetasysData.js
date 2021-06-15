/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Meter = require('./../../models/Meter');
const moment = require('moment');
const loadCsvInput = require('./loadCsvInput');
const path = require('path');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
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
 */
async function insertMetasysData(filePath, readingInterval, readingRepetition, cumulativeIndicator, cumulativeReset, conn) {
	const fileName = path.basename(filePath);
	const meter = await Meter.getByName(fileName.replace('.csv', ''), conn);
	return loadCsvInput(filePath = filePath,
						meterID = meter.id,
						mapRowToModel = row => {
							readRate = row[3].replace(' kW', '');
							readRate = parseFloat(readRate);
							// Metasys timestamps look like 11:00:00 7/31/16
							endTimestamp = moment(row[0], 'MM/DD/YY HH:mm');
							// TODO This test really should be updated since the pipeline now accepts
							// end only times.
							startTimestamp = moment(endTimestamp).subtract(readingInterval, 'minutes');
							return [readRate, startTimestamp, endTimestamp];
						},
						readAsStream = false,
						isCumulative = cumulativeIndicator,
						cumulativeReset = cumulativeReset,
						// TODO This pipeline is going away. Using dummy times that allow reset at any time and no variation in gap & reading length.
						'0:00:00',
						'23:59:59.99999',
						0,
						0,
						readingRepetition,
						'decreasing',
						false,
						conditionSet = undefined,
						conn = conn);
}

module.exports = insertMetasysData;

