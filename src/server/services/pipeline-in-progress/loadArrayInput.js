/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
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

	// TODO: Need to implement interface to let user pass in the params to the pipeline formally
	// Temporary values for params
	let onlyEndTime = false; // onlyEndtime is false by default
	let Tgap = 0; // time in seconds
	let Tlen = 0; // time in seconds
	let resetStart = '00:00:00.000'; // time in format HH:mm:ss.SSS
	let resetEnd = '23:59:99.999'; // time in format HH:mm:ss.SSS

	readingsArray = processData(readingsArray, meterID, isCumulative, cumulativeReset, resetStart, resetEnd, 
								readingRepetition, onlyEndTime, Tgap, Tlen, conditionSet, conn);
							
	return await Reading.insertOrIgnoreAll(readingsArray, conn);
}

module.exports = loadArrayInput;
