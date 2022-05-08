/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const reqPromise = require('request-promise-native');
const readCsv = require('./readCsv');
const promisify = require('es6-promisify');
const parseString = require('xml2js').parseString;
const Meter = require('../models/Meter');
const _ = require('lodash');
const stopDB = require('../models/database').stopDB;
const { log } = require('../log');
const moment = require('moment');

const parseXMLPromisified = promisify(parseString);

async function parseCSV(filename) {
	// returns a list of lists representing the lines of the file
	const meterInfo = await readCsv(filename);
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
			setTimeout(() => reject(new Error(`CSV line ${csvLine}: Failed to GET ${url} within ${timeout} ms`)), timeout))
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
	// TODO: get the unit when the MAMAC meter is first probed and created.
	// For now, we assume they are kWh as before resource generalization.
	let displayable = true;
	const kWhUnit = await Unit.getByName( 'kWh', conn );
	let unitId; 
	if (kWhUnit === null) {
		log.warn("kWh not found while creating MAMAC meter so units set to undefined and not displayable");
		displayable = false;
		unitId = undefined;
	} else {
		unitId = kWhUnit.id;
	}
	return reqWithTimeout(url, 5000, csvLine)
		.then(raw => parseXMLPromisified(raw))
		.then(xml => {
			const name = xml.Maverick.NodeID[0];
			return new Meter(undefined, name, ip, true, displayable, Meter.type.MAMAC, null, undefined, undefined,
				'created via MAMAC meter upload on ' + moment().format(), unitId, unitId);
		});
}

/**
 *
 * @param rows The rows of the meters
 * @returns {Array.<Promise.<Meter>>}
 */
function infoForAllMeters(rows, conn) {
	return rows.map((row, index) => getMeterInfo(`http://${row.ip}/sm101.xml`, row.ip, index + 2));
}

/**
 * promises to insert the meters into the database
 * @param rows rows of the meters
 * @param conn the database connection to use
 * @returns {Promise.<>}
 */
async function insertMeters(rows, conn) {
	const errors = [];
	await Promise.all(infoForAllMeters(rows, conn).map(
			(promise, index) => promise
			.then(async meter => {
				if (await meter.existsByName(conn)) {
					log.info(`CSV line ${index + 2}: Skipping existing meter ${meter.name}`);
				} else {
					await meter.insert(conn);
				}
			})
			.catch(error => errors.push(error))
		)
	);
	return errors;
}

async function insertMetersWrapper(filename, conn) {
	const errors = await parseCSV(filename)
		.then(ips => insertMeters(ips, conn))
		.catch(err => log.error(`Error inserting meters: ${err}`, err));
}

module.exports = {
	insertMetersWrapper,
	insertMeters
};
