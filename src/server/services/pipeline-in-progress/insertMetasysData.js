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
 * @param {time} readingInterval the length in time for each reading
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {boolean} cumulativeIndicator true if the given data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
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
						timeSort = 'decreasing',
						readingRepetition = readingRepetition,
						isCumulative = cumulativeIndicator,
						cumulativeReset = cumulativeReset,
						// TODO This pipeline is going away. Using dummy times that allow reset at any time and no variation in gap & reading length.
						cumulativeResetStart = '0:00:00',
						cumulativeResetEnd = '23:59:59.99999',
						readingGap = 0,
						readingLengthVariation = 0,
						isEndOnly = false,
						headerRow = false,
						conditionSet = undefined,
						conn = conn);
}

module.exports = insertMetasysData;

