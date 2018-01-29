/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const Reading = require('../models/Reading');

const { log } = require('../log');

/**
 * Uses the provided dataReader function to poll the provided meters for new readings,
 * and inserts any new readings into the database.
 * @param dataReader {function} A function to fetch readings from each meter
 * @param metersToUpdate [Meter] An array of meters to be updated
 * @return {Promise.<void>}
 */
async function updateAllMeters(dataReader, metersToUpdate) {
	const time = new Date();
	log.info(`Getting meter data ${time.toISOString()}`);
	try {
		// Do all the network requests in parallel, then throw out any requests that fail after logging the errors.
		const readingInsertBatches = _.filter(await Promise.all(
			metersToUpdate
				.map(dataReader)
				.map(p => p.catch(err => {
					let uri = '[NO URI AVAILABLE]';
					if (err.options !== undefined && err.options.uri !== undefined) {
						uri = err.options.uri;
					}
					log.error(`ERROR ON REQUEST TO ${uri}, ${err.message}`, err);
					return null;
				}))
		), elem => elem !== null);

		// Flatten the batches (an array of arrays) into a single array.
		const allReadingsToInsert = [].concat(...readingInsertBatches);
		await Reading.insertOrUpdateAll(allReadingsToInsert);
		log.info('Update finished');
	} catch (err) {
		log.error(`Error updating all meters: ${err}`, err);
	}
}


module.exports = updateAllMeters;
