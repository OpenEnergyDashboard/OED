/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const readCsv = require('./readCsv');
const loadArrayInput = require('./loadArrayInput');
const loadCsvStream = require('./loadCsvStream');
const { log } = require('../../log');

/**
 * Read a CSV file and select needed column to return an array of reading value and reading time
 * @param {string} filePath path to file to load including file name
 * @param {number} meterID meter id being input
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} readAsStream true if prefer to read file as CSV stream
 * @param {boolean} isCumulative true if the given data is cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, threshold, maxError)
 * @param {boolean} headerRow true if the given file has a header row
 * @param {array} conn connection to database
 */
async function loadCsvInput(filePath, meterID, mapRowToModel, readAsStream, isCumulative, cumulativeReset, readingRepetition, conditionSet, headerRow, conn) {
	try {
		if (readAsStream) {
			const stream = fs.createReadStream(filePath);
			return loadCsvStream(stream, meterID, mapRowToModel, conditionSet, conn);
		} else {
			const dataRows = headerRow ? (await readCsv(filePath)).shift() : (await readCsv(filePath));
			return loadArrayInput(dataRows, meterID, mapRowToModel, isCumulative, cumulativeReset, readingRepetition, conditionSet, conn);
		}
	} catch (err) {
		log.error(`Error updating meter ${meterID} with data from ${filePath}: ${err}`, err);
	}
}

module.exports = loadCsvInput;

