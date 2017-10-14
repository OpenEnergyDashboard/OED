/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const readMamacData = require('./readMamacData');

/**
 * Pulls new data for all the meters in the database.
 * This assumes that every meter is a MAMAC meter with a valid IP address.
 */
async function updateAllMeters() {
	const time = new Date();
	console.log(`Getting meter data ${time.toISOString()}`); // eslint-disable-line no-console
	try {
		const allMeters = await Meter.getAll();
		const metersToUpdate = allMeters.filter(m => m.enabled && m.type === Meter.type.MAMAC);

		// Do all the network requests in parallel, then throw out any requests that fail after logging the errors.
		const readingInsertBatches = _.filter(await Promise.all(
			metersToUpdate
				.map(readMamacData)
				.map(p => p.catch(err => {
					console.error(err);
					return null;
				}))
		), elem => elem !== null);

		// Flatten the batches (an array of arrays) into a single array.
		const allReadingsToInsert = [].concat(...readingInsertBatches);
		await Reading.insertOrUpdateAll(allReadingsToInsert);
		console.log('Update finished'); // eslint-disable-line no-console
	} catch (err) {
		console.error(err); // eslint-disable-line no-console
	}
}


module.exports = updateAllMeters;
