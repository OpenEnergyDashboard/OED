/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Reading = require('../models/Reading');

const { log } = require('../log');

/**
 * Uses the provided dataReader function to poll the provided meters for new readings,
 * and inserts any new readings into the database.
 * @param dataReader {function} A function to fetch readings from each meter
 * @param metersToUpdate [Meter] An array of meters to be updated
 * @param conn the database connection to use
 * @returns {Promise.<void>}
 */
async function updateAllMeters(dataReader, metersToUpdate, conn) {
	log.info(`Getting meter data`);
	try {
		// Do all the network requests in parallel and log errors.
		// Ignoring that loadArrayInput is called in this sequence and returns values
		// since this is only called by an automated process at this time.
		// Issues from the pipeline will be logged by called functions.
		await Promise.all(
			metersToUpdate
				.map(meter => dataReader(meter, conn))
				.map(p => p.catch(err => {
					let ipAddress = '[NO IP ADDRESS AVAILABLE]';
					if (err.options !== undefined && err.options.ipAddress !== undefined) {
						ipAddress = err.options.ipAddress;
					}
					log.error(`ERROR ON REQUEST TO METER ${ipAddress}, ${err.message}`, err);
					return null;
				})));
		log.info('Update finished');
	} catch (err) {
		log.error(`Error updating all meters: ${err}`, err);
	}
}


module.exports = updateAllMeters;
