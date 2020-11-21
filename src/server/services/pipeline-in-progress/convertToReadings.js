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
 * @param {2d array} toConvert a number array in which each row represents a Reading values (reading, startTime, endTime)
 * @param {int} meterID ID of the meter which all the Reading values belong to
 * @param {dict} conditionSet used to validate readings (minVal, maxVal, minDate, maxDate, interval, maxError)
 */
function convertToReadings(toConvert, meterID, conditionSet) {
	readings = toConvert.map(row => new Reading(meterID, row[0], row[1], row[2]));
	if (conditionSet !== undefined && !validateReadings(readings, conditionSet)) {
		log.warn(`ERROR WHEN VALIDATING READINGS FROM METER ${ipAddress}`);
		return null;
	}
	return readings;
}

module.exports = convertToReadings;

