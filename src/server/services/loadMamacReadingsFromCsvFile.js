/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const moment = require('moment');
const Reading = require('../models/Reading');
const loadFromCsvStream = require('./loadFromCsvStream');

/**
 * Returns a promise to insert readings from a MAMAC csv file with the given path into the database
 *
 * Uses a long-running transaction to send information to the database and discard it as soon as possible.
 * @param {string} filePath the path to the csv file
 * @param {Meter} meter the meter to associate the readings with
 * @param {moment.Duration} readingDuration The duration of the readings in this csv file.
 * @return {Promise.<>}
 */
function loadMamacReadingsFromCsvFile(filePath, meter, readingDuration) {
	const stream = fs.createReadStream(filePath);
	return loadFromCsvStream(stream,
		row => {
			const readRate = row[0];
			// Mamac timestamps look like 11:00:00 7/31/16
			const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
			const startTimestamp = moment(endTimestamp).subtract(readingDuration);
			return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
		},
		Reading.insertAll
	);
}

module.exports = loadMamacReadingsFromCsvFile;
