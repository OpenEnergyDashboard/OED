/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const reqPromise = require('request-promise-native');
const readCSV = require('./readCSV');
const promisify = require('es6-promisify');
const parseString = require('xml2js').parseString;
const Meter = require('../models/Meter');
const _ = require('lodash');
const stopDB = require('../models/database').stopDB;
const { log } = require('../log');

const parseXMLPromisified = promisify(parseString);

async function parseCSV(filename) {
	// returns a list of lists representing the lines of the file
	const meterInfo = await readCSV(filename);
	// the headers should be in the first line
	const headers = meterInfo[0];
	const meterDataRows = meterInfo.slice(1);
	return meterDataRows.map(row => _.zipObject(headers, row));
}

/**
 * Creates a promise that resolves to the raw content of the URL and rejects on
 * error or timeout.
 * @param {string} url The URL of the resource to GET
 * @param {number} timeout The time to allow, in milliseconds
 * @param csvLine The current CVS line
 * @returns {Promise.<string>}
 */
async function reqWithTimeout(url, timeout, csvLine) {
	return Promise.race([
		reqPromise(url),
		new Promise((resolve, reject) =>
			setTimeout(() => reject(new Error(`CSV line ` + csvLine + `: Failed to GET ${url} within ${timeout} ms`)), timeout))
	]);
}

/**
 * Creates a promise to create a Mamac meter based on a URL to grab XML from and an IP address for the meter.
 *
 * The URL should be formed from the IP address.
 * @param url The url to retrieve meter info from.
 * @param ip The ip of the meter being created
 * @param csvLine The current CSV line
 * @returns {Promise.<Meter>}
 */
async function getMeterInfo(url, ip, csvLine) {
	return reqWithTimeout(url, 5000, csvLine)
		.then(raw => parseXMLPromisified(raw))
		.then(xml => {
			const name = xml.Maverick.NodeID[0];
			return new Meter(undefined, name, ip, true, Meter.type.MAMAC);
		});
}

/**
 *
 * @param rows The rows of the meters
 * @returns {Array.<Promise.<Meter>>}
 */
function infoForAllMeters(rows) {
	return rows.map((row, index) => getMeterInfo(`http://${row.ip}/sm101.xml`, row.ip, index + 2));
}

/**
 * promises to insert the meters into the database
 * @param rows rows of the meters
 * @returns {Promise.<>}
 */
async function insertMeters(rows) {
	const errors = [];
	await Promise.all(infoForAllMeters(rows).map(
			(promise, index) => promise
			.then(async meter => {
				if (await meter.existsByName()) {
					log.info(`CSV line ` + (index + 2)+ `: Skipping existing meter ${meter.name}`);
				} else {
					meter.insert();
				}
			})
			.catch(error => errors.push(error))
		)
	);
	return errors;
}

async function insertMetersWrapper(filename) {
	const errors = await parseCSV(filename)
		.then(ips => insertMeters(ips))
		.catch(err => log.error(`Error inserting meters: ${err}`, err))
		.then(stopDB());

	for (const err of errors) {
		log.error(`Error inserting meters: ${err}`, err);
	}

	log.info('Done inserting meters');
}

module.exports = {
	insertMetersWrapper,
	insertMeters
};
