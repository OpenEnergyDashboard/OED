/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const readCSV = require('./readCSV');
const loadArrayInput = require('./loadArrayInput');
const loadCsvStream = require('./loadCsvStream');
const { log } = require('../../log');

/**
 * Read a CSV file and select needed column to return an array of reading value and reading time
 * @param {string} filePath
 * @param {string} meterID
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} readAsStream true if prefer to read file as CSV stream
 * @param {boolean} isCummulative true if the given data is cummulative
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, threshold, maxError)
 * @param {array} conn connection to database
 */

async function loadCsvInput(filePath, meterID, mapRowToModel, readAsStream, isCummulative, readingRepetition, conditionSet, conn) {
	try {
		if (readAsStream) {
			const stream = fs.createReadStream(filePath);
			return loadCsvStream(stream, meterID, mapRowToModel, conditionSet, conn);
		} else {
			const dataRows = await readCSV(filePath);
			return loadArrayInput(dataRows, meterID, mapRowToModel, isCummulative, readingRepetition, conditionSet, conn);
		}
	} catch (err) {
		log.error(`Error updating meter ${meterID}: ${err}`, err);
	}
}

module.exports = loadCsvInput;

