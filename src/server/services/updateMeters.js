/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const Meter = require('../models/Meter');
const Reading = require('../models/Reading');
const readMamacData = require('./readMamacData');
const log = require('../log');

/**
 * Pulls new data for all the meters in the database.
 * This assumes that every meter is a MAMAC meter with a valid IP address.
 */
async function updateAllMeters(reader) {
	const time = new Date();
	log(`Getting meter data ${time.toISOString()}`);
	try {
		const allMeters = await Meter.getAll();
		const metersToUpdate = allMeters.filter(m => m.enabled && m.type === Meter.type.MAMAC);
		// console.log(reader);
		console.log(metersToUpdate);
		console.log(metersToUpdate.map(reader));

		// Do all the network requests in parallel, then throw out any requests that fail after logging the errors.
		const readingInsertBatches = _.filter(await Promise.all(
			metersToUpdate
				.map(reader)
				.map(p => console.log(p)
					// p.catch(err => {
				// 	console.log(p);
				// 	let uri = '[NO URI AVAILABLE]';
				// 	if (err.options !== undefined && err.options.uri !== undefined) {
				// 		uri = err.options.uri;
				// 	}
				// 	log(`ERROR ON REQUEST TO ${uri}, ${err.message}`, 'error');
				// 	return null;
				// }))
		), elem => elem !== null));

		// Flatten the batches (an array of arrays) into a single array.
		const allReadingsToInsert = [].concat(...readingInsertBatches);
		await Reading.insertOrUpdateAll(allReadingsToInsert);
		log('Update finished');
	} catch (err) {
		console.log(err);
		log(`Error updating all meters: ${err}`, 'error');
	}
}


module.exports = updateAllMeters;
