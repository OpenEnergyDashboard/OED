/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const convertToReadings = require('./convertToReadings');
const { log } = require('../../log');

/**
 * Select and process needed values from a matrix and return an array of reading value and reading time
 * @param {2d array} dataRows
 * @param {string} meterID
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} isCummulative true if the given data is cummulative
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 */

async function loadArrayInput(dataRows, meterID, mapRowToModel, isCummulative, conditionSet, conn) {
	try {
		readingsArray = mapRowToModel(dataRows);
		if (isCummulative) {
			readingsArray = handleCummulative(readingsArray);
		}
		readings = convertToReadings(readingsArray, meterID, conditionSet);
		await Reading.insertOrIgnoreAll(readings, conn);
	} catch (err) {
		console.log("Error");
		log.error(`Error updating meter ${ipAddress}: ${err}`, err);
	}
}

module.exports = loadArrayInput;
