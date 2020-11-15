/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const convertToReadings = require('./convertToReadings');
const { log } = require('../../log');
const handleCumulative = require('./handleCumulative');

/**
 * Select and process needed values from a matrix and return an array of reading value and reading time
 * @param {2d array} dataRows
 * @param {string} meterID
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} isCumulative true if the given data is Cumulative
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 */

async function loadArrayInput(dataRows, meterID, mapRowToModel, isCumulative, readingRepetition, conditionSet, conn) {
	readingsArray = dataRows.map(mapRowToModel);
	if (isCumulative) {
		readingsArray = handleCumulative(readingsArray, readingRepetition);
	}
	readings = convertToReadings(readingsArray, meterID, conditionSet);
	return await Reading.insertOrIgnoreAll(readings, conn);
}

module.exports = loadArrayInput;
