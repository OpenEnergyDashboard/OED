/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const csv = require('csv');
const fs = require('fs');
const moment = require('moment');
const Reading = require('../models/Reading');
const db = require('../models/database').db;

/**
 * Returns a promise to insert readings from a MAMAC csv file with the given path into the database
 *
 * Uses a long-running transaction to send information to the database and discard it as soon as possible.
 * @param {string} filePath the path to the csv file
 * @param {Meter} meter the meter to associate the readings with
 * @param {moment.Duration} readingDuration The duration of the readings in this csv file.
 * @return {Promise.<void>}
 */
function insertMamacReadingsFromCsvFile(filePath, meter, readingDuration) {
	// Maps a CSV row to a reading (using the meter from the enclosing scope)
	function mapCsvRowToReading(row) {
		const readRate = row[0];
		// Mamac timestamps look like 11:00:00 7/31/16
		const endTimestamp = moment(row[1], 'HH:mm:ss MM/DD/YYYY');
		const startTimestamp = moment(endTimestamp).subtract(readingDuration);
		return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
	}
	return db.tx(t =>
		// We have to manually create a promise here so that we can call resolve() when the stream ends.
		new Promise(resolve => {
			const sourceStream = fs.createReadStream(filePath);
			const parser = csv.parse();
			const MIN_INSERT_BUFFER_SIZE = 1000;
			// A buffer of readings that are not yet inserted, but are waiting to be inserted.
			let readingsToInsert = [];
			// An array of promises for batch inserts that have already been started.
			const readingInsertsInProgress = [];

			function insertQueuedReadings() {
				const insert = Reading.insertAll(readingsToInsert, t);
				readingInsertsInProgress.push(insert);
				readingsToInsert = [];
			}

			// Defines how the parser behaves when it has new data (readings to be inserted)
			parser.on('readable', () => {
				let row;
				// We can only get the next row once so we check that it isn't null at the same time that we assign it
				while ((row = parser.read()) !== null) { // eslint-disable-line no-cond-assign
					readingsToInsert.push(mapCsvRowToReading(row));
				}
				if (readingsToInsert.length >= MIN_INSERT_BUFFER_SIZE) {
					insertQueuedReadings();
				}
			});

			// Defines what happens when the parser's input stream is finished (and thus the promise needs to be resolved)
			parser.on('finish', () => {
				// Insert any readings left in the buffer
				if (readingsToInsert.length > 0) {
					insertQueuedReadings();
				}
				// Resolve the promise, telling pg-promise to run the batch query and complete (or rollback) the
				// transaction.
				resolve(t.batch(readingInsertsInProgress));
			});

			// Send the file into the parser, starting the process.
			sourceStream.pipe(parser);
		})
	);
}

module.exports = insertMamacReadingsFromCsvFile;
