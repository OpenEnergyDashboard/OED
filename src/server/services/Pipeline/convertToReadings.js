/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const { log } = require('../../log');
const validateReading = require('./validateReadings')

/**
 * Convert an matrix of number values to an array of Readings
 * @param {matrix of numbers} toConvert a number array in which each row represents a Reading values (reading, startTime, endTime)
 * @param {ipAddress} meter IP address of the meter which all the Reading values belong to
 * @param {number} maxVal maximum acceptable reading value
 * @param {number} minVal minimum acceptable reading value
 * @param {date} minDate earliest acceptable date
 * @param {date} maxDate latest acceptable date
 * @param {boolean} equalInterval true if expecting equal intervals, otherwise false
 * @param {number} maxError the maximum number of errors to be reported, ignore the rest
 */

function convertToReadings(toConvert, ipAddress, minVal, maxVal, minDate, maxDate, equalInterval, maxError) {
	readings = toConvert.map(row => new Reading(ipAddress, row[0], row[1], row[2]));
	if (!validateReading(readings, minVal, maxVal, minDate, maxDate, equalInterval, maxError)) {
		log.error(`ERROR WHEN VALIDATING READINGS FROM METER ${ipAddress}`);
		return null;
	}
	return readings;
}

module.exports = convertToReadings;

