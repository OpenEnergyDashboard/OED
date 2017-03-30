/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Script to add meters from a .xlsx file
const reqPromise = require('request-promise-native');
const XLSX = require('xlsx');
const path = require('path');
const promisify = require('es6-promisify');
const parseString = require('xml2js').parseString;
const Meter = require('../server/models/Meter');
const stopDB = require('../server/models/database').stopDB;

const parseXMLPromisified = promisify(parseString);

function parseXLSX(filename) {
	const workbook = XLSX.readFile(filename);
	// This isn't a property so we don't want dot-notation
	const worksheet = workbook.Sheets['Sheet1']; // eslint-disable-line dot-notation
	return XLSX.utils.sheet_to_json(worksheet);
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
		const ips = parseXLSX(filename);
		await insertMeters(ips);
		console.log('Done inserting meters'); // eslint-disable-line no-console
	} catch (err) {
		console.error('Error importing meters: ');
		console.error(err); // eslint-disable-line no-console
	} finally {
		stopDB();
	}
}

// The first two elements are 'node' and the name of the file. We only want arguments passed to it.
const args = process.argv.slice(2);
if (args.length !== 1) {
	console.error(`Expected one argument (path to meters xlsx file), but got ${args.length} instead`);
} else {
	const absolutePath = path.resolve(args[0]);
	console.log(`Importing meters from ${absolutePath}`);
	insertMetersWrapper(absolutePath);
}

