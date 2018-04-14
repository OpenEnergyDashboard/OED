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
 * Creates a promise to create a Mamac meter based on a URL to grab XML from and an IP address for the meter.
 *
 * The URL should be formed from the IP address.
 * @param url The url to retrieve meter info from.
 * @param ip The ip of the meter being created
 * @returns {Promise.<Meter>}
 */
async function getMeterInfo(url, ip) {
	const raw = await reqPromise(url);
	const xml = await parseXMLPromisified(raw);
	const name = xml.Maverick.NodeID[0];
	return new Meter(undefined, name, ip, true, Meter.type.MAMAC);
}

/**
 *
 * @param rows The rows of the meters
 * @returns {Array.<Promise.<Meter>>}
 */
function infoForAllMeters(rows) {
	return rows.map(row => getMeterInfo(`http://${row.ip}/sm101.xml`, row.ip));
}

/**
 * promises to insert the meters into the database
 * @param rows rows of the meters
 * @returns {Promise.<>}
 */
async function insertMeters(rows) {
	const meters = await Promise.all(infoForAllMeters(rows));
	await Promise.all(meters.map(m => m.insert()));
}

async function insertMetersWrapper(filename) {
	try {
		const ips = await parseCSV(filename);
		await insertMeters(ips);
		log.info('Done inserting meters');
	} catch (err) {
		log.error(`Error inserting meters: ${err}`, err);
	} finally {
		stopDB();
	}
}

module.exports = {
	insertMetersWrapper,
	insertMeters
};
