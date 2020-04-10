/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Meter = require('./../../models/Meter');
const moment = require('moment');
const loadCsvInput = require('./loadCsvInput')
const path = require('path');

/**
 * Reads CSV file passed to input all the Metasys readings into database.
 * @param filePath  the filePath to read the metasys data
 * @param readingInterval  value of the reading interval. For example 60 minutes, 30 minutes.
 * @param readingRepetition value is 1 if reading is not duplicated. 2 if repeated twice and so on.
 * @param  cumulativeIndicator false if readings are not cumulative and vice-versa.
 * @param conn the database connection to use
 */

async function insertMetasysData(filePath, readingInterval, readingRepetition, cumulativeIndicator, conn) {
	const fileName = path.basename(filePath);
	const meter = await Meter.getByName(fileName.replace('.csv', ''), conn);
	return loadCsvInput(filePath = filePath,
						meterID = meter.id, 
						mapRowToModel = row => {
							readRate = row[3].replace(' kW', '');
							readRate = Math.round(parseFloat(readRate));
							// Metasys timestamps look like 11:00:00 7/31/16
							endTimestamp = moment(row[0], 'MM/DD/YY HH:mm');
							startTimestamp = moment(endTimestamp).subtract(readingInterval, 'minutes');
							return [readRate, startTimestamp, endTimestamp];
						},
						readAsStream = false,
						isCummulative = cumulativeIndicator,
						readingRepetition = readingRepetition,
						conditionSet = undefined,
						conn = conn);
}

module.exports = insertMetasysData;

