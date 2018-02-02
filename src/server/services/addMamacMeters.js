/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// Script to add meters from a .xlsx file
const reqPromise = require('request-promise-native');
const path = require('path');
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
 * @param ips The IPs of the meters
 * @returns {Array.<Promise.<Meter>>}
 */
function allMeters(ips) {
	return ips.map(ip => getMeterInfo(`http://${ip.ip}/sm101.xml`, ip.ip));
}

/**
 * promises to insert the meters into the database
 * @param ips IPs of the meters
 * @returns {Promise.<>}
 */
async function insertMeters(ips) {
	const meters = await Promise.all(allMeters(ips));
	return await Promise.all(meters.map(m => m.insert()));
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

// The first two elements are 'node' and the name of the file. We only want arguments passed to it.
const args = process.argv.slice(2);
if (args.length !== 1) {
	log.error(`Expected one argument (path to csv file of meter ips), but got ${args.length} instead`, 'error');
} else {
	const absolutePath = path.resolve(args[0]);
	log.info(`Importing meters from ${absolutePath}`);
	insertMetersWrapper(absolutePath);
}

