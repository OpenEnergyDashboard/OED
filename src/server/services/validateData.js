/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { log } = require('../log');

/**
 * Validate the data returned from dataReader in updateMeters function
 * @param currData A Reading value to be updated
 * @param minVal minimum allowed value, currently set by updateMeters
 * @param maxVal maximium allowed value, currently set by updateMeters
 * @return boolean
 */

function validateData(currData, minVal, maxVal) {
	if (currData === null) {
		return false;
	}
	if (currData.reading < minVal || currData.reading > maxVal) {
		log.error(`RECEIVED OUT-OF-BOUND DATA FROM METER ${currData.meterID}: ${currData.reading}`);
		return false;
	}
	return true;
}

module.exports = validateData;
