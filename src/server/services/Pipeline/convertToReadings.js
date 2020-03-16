/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const Reading = require('../../models/Reading');
const { log } = require('../../log');
const { validateReadings } = require('./validateReadings');
const moment = require('moment');

/**
 * Convert an matrix of number values to an array of Readings
 * @param {matrix of numbers} toConvert a number array in which each row represents a Reading values (reading, startTime, endTime)
 * @param {ipAddress} meter IP address of the meter which all the Reading values belong to
 * @param {number} maxVal maximum acceptable reading value
 * @param {number} minVal minimum acceptable reading value
 * @param {date} minDate earliest acceptable date
 * @param {date} maxDate latest acceptable date
 * @param {number} interval the expected interval between reading time in seconds
 * @param {number} maxError the maximum number of errors to be reported, ignore the rest
 */

function convertToReadings(toConvert, ipAddress, minVal, maxVal, minDate, maxDate, interval, maxError) {
	readings = toConvert.map(row => new Reading(ipAddress,
												row[0],
												moment(row[1], 'HH:mm:ss MM/DD/YYYY'),
												moment(row[2], 'HH:mm:ss MM/DD/YYYY')));
	if (!validateReadings(readings, minVal, maxVal, minDate, maxDate, interval, maxError)) {
		//log.warn(`ERROR WHEN VALIDATING READINGS FROM METER ${ipAddress}`);
		return null;
	}
	return readings;
}

module.exports = convertToReadings;

