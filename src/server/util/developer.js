/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const database = require('../models/database');
 const sqlFile = database.sqlFile;
 const { getConnection } = require('../db');
 const { refreshAllReadingViews } = require('../services/refreshAllReadingViews');

// These functions are designed for OED developers.

/** 
 * Installs the shift_readings function into the database.
 * This is normally done when a developer installs OED.
 */
async function createShiftReadingsFunction() {
	const conn = getConnection();
	return conn.none(sqlFile('developer/create_shift_readings.sql'));
}

/**
 * Shifts the readings of meter with name meterName to the current time in the timezone provided.
 * This can be run from inside the OED web Docker container with:
 * node -e 'require("./src/server/util/developer.js").shiftReadings("test1", "cdt")'
 * where you replace the "test1" and "cdt" with the values you want.
 * Note you will get "The readings were shifted by:  { compare_shift: null }" if the meter name is invalid.
 * Also, it returns "The readings were shifted by:  a few seconds" when no shift is really done (why is unknown).
 * @param {*} meterName The name of the meter to shift the readings.
 * @param {*} timezone The timezone to use when shifting to current time.
 */
 async function shiftReadings(meterName, timezone) {
	console.log(`shifting meter \"${meterName}\" to timezone \"${timezone}\"`);
	conn = getConnection();
	const row = await conn.one(sqlFile('developer/shift_readings.sql'), { meter_name: meterName, timezone: timezone });
	console.log('    The readings were shifted by: ', row.shift_readings.humanize());
	console.log('refreshing all views since readings changed');
	await refreshAllReadingViews();
}

 module.exports = {
	createShiftReadingsFunction,
	shiftReadings
}
