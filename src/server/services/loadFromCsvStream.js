/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const csv = require('csv');
const { log } = require('../log');

/**
 * Function to load a CSV file into the database in a configurable manner.
 * Wraps all load operations in a transaction, so if one row fails no rows will be inserted.
 * @example
 * loadFromCsvStream(
 *     &#9;stream,
 *     &#9;row => new Reading(...),
 *     &#9;(readings, tx) => Reading.insertAll(readings, tx)
 * ).then(() => log('Inserted!'));
 * @param stream the raw stream to load from
 * @param {function(Array.<*>, ...*): M} mapRowToModel A function that maps a CSV row (an array) to a model object
 * @param {function(Array.<M>, ITask): Promise<>} bulkInsertModels A function that bulk inserts an array of models using the supplied transaction
 * @param conn the database connection to use
 * @template M
 */
function loadFromCsvStream(stream, mapRowToModel, bulkInsertModels, conn) {
	return conn.tx(t => new Promise(resolve => {
		let rejected = false;
		const error = null;
		const MIN_INSERT_BUFFER_SIZE = 1000;
		let modelsToInsert = [];
		const pendingInserts = [];

		const parser = csv.parse();

		function insertQueuedModels() {
			const insert = bulkInsertModels(modelsToInsert, t);
			pendingInserts.push(insert);
			modelsToInsert = [];
		}

		// Defines how the parser behaves when it has new data (models to be inserted)
		parser.on('readable', () => {
			let row;
			// We can only get the next row once so we check that it isn't null at the same time that we assign it
			while ((row = parser.read()) !== null) { // tslint:disable-line no-conditional-assignment
				if (!rejected) {
					modelsToInsert.push(mapRowToModel(row));
				}
			}
			if (!rejected) {
				if (modelsToInsert.length >= MIN_INSERT_BUFFER_SIZE) {
					insertQueuedModels();
				}
			}
		});
		parser.on('error', err => {
			log.warn('Error parsing CSV input', err);
			rejected = true;
		});
		// Defines what happens when the parser's input stream is finished (and thus the promise needs to be resolved)
		parser.on('finish', () => {
			// Insert any models left in the buffer
			if (modelsToInsert.length > 0) {
				insertQueuedModels();
			}
			// Resolve the promise, telling pg-promise to run the batch query and complete (or rollback) the
			// transaction.
			resolve(t.batch(pendingInserts).then(arg => {
				if (rejected) {
					return Promise.reject(error);
				} else {
					return Promise.resolve(arg);
				}
			}));
		});
		stream.pipe(parser);
	}));
}
module.exports = loadFromCsvStream;

