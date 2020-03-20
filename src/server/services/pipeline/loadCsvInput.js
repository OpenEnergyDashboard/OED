/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const readCSV = require('./readCSV');
const loadArrayInput = require('./loadArrayInput');
const loadCsvStream = require('./loadCsvStream');
const { log } = require('../log');

/**
 * Read a CSV file and select needed column to return an array of reading value and reading time
 * @param {string} filePath
 * @param {string} ipAddress
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model 
 * @param {boolean} readAsStream true if prefer to read file as CSV stream
 * @param {boolean} isCummulative true if the given data is cummulative
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn connection to database
 */

async function loadCsvInput(filePath, ipAddress, mapRowToModel, readAsStream, isCummulative, conditionSet, conn) {
	try {
		if (readAsStream) {
			const stream = fs.createReadStream(filePath);
			await loadCsvStream(stream, ipAddress, mapRowToModel, isCummulative, conditionSet, conn);
		} else {
			const dataRows = await readCSV(filename);
			await loadArrayInput(dataRows, ipAddress, mapRowToModel, isCummulative, conditionSet, conn);
		}
	} catch (err) {
		log.error(`Error updating meter ${ipAddress}: ${err}`, err);
	}
}

module.exports = loadCsvInput;

