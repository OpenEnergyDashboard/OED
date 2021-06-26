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
 * @param {time} readingDuration the length in time for each reading
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
						timeSort = 'increasing',
						readingRepetition = 1,
						isCumulative = false,
						cumulativeReset = false,
						// No cumulative reset so dummy times.
						cumulativeResetStart = '0:00:00',
						cumulativeResetEnd = '0:00:00',
						// Every reading should be adjacent (no gap)
						readingGap = 0,
						// Every reading should be the same length
						readingLengthVariation = 0,
						isEndOnly = false,
						headerRow = false,
						conditionSet = undefined,
						conn = conn);
}

module.exports = insertMamacData;
