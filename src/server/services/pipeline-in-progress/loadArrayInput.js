/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const convertToReadings = require('./convertToReadings');
const { log } = require('../../log');
const handleCumulative = require('./handleCumulative');
const processData = require('./processData');
/**
 * Select and process needed values from a matrix and return an array of reading value and reading time
 * @param {object[[]]} dataRows where each row is defined by mapRowToModel function
 * @param {number} meterID meter id being input
 * @param {function} mapRowToModel a customized function that map needed values from each row to the Reading model
 * @param {boolean} isCumulative true if the given data is Cumulative
 * @param {boolean} cumulativeReset true if the cumulative data is reset at midnight
 * @param {number} readingRepetition number of times each reading is repeated where 1 means no repetition
 * @param {array} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 * @param {array} conn connection to database
 */
async function loadArrayInput(dataRows, meterID, mapRowToModel, isCumulative, cumulativeReset, readingRepetition, conditionSet, conn) {
	readingsArray = dataRows.map(mapRowToModel);
	// Temporary values for params
	let onlyEndtime = true;
	let Tgap = 0;
	let Tlen = 0;

	readingsArray = processData(readingsArray, meterID, isCumulative, cumulativeReset, readingRepetition, onlyEndtime, Tgap, Tlen, conditionSet);
	return await Reading.insertOrIgnoreAll(readingsArray, conn);
}

module.exports = loadArrayInput;
