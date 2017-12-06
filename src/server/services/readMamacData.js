/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const reqPromise = require('request-promise-native');
const promisify = require('es6-promisify');
const csv = require('csv');
const moment = require('moment');
const Reading = require('../models/Reading');

const parseCsv = promisify(csv.parse);

function parseTimestamp(raw) {
	raw = raw.trim();
	const timestampRegExp = /^\d{2}:\d{2}:\d{2} \d{1,2}\/\d{1,2}\/\d{1,2}$/;
	if (!timestampRegExp.test(raw)) {
		throw new Error(`Raw timestamp ${raw} does not pass regex validation`);
	}
	const ts = moment(raw, 'HH:mm:ss MM/DD/YY');
	if (!ts.isValid()) {
		throw new Error(`raw timestamp ${raw} does not parse to a valid moment object`);
	}
	return ts;
}

/**
 * Returns a promise containing all the readings currently stored on the given meter's hardware.
 * The promise will reject if the meter doesn't have an IP address.
 * @param meter
 * @returns {Promise.<array.<Reading>>}
 */
async function readMamacData(meter) {
	// First get a promise that's just the meter itself (or an error if it doesn't have an IP address)
	if (!meter.ipAddress) throw new Error(`${meter} doesn't have an IP address to read data from`);
	if (!meter.id) throw new Error(`${meter} doesn't have an id to associate readings with`);
	const rawReadings = await reqPromise(`http://${meter.ipAddress}/int2.csv`);
	const parsedReadings = await parseCsv(rawReadings);
	return parsedReadings.map(raw => {
		const reading = Math.round(Number(raw[0]));
		if (isNaN(reading)) {
			throw new Error(`Meter reading ${reading} parses to NaN for meter named ${meter.name} with id ${meter.id}`);
		}
		return new Reading(
				meter.id,
				reading,
				parseTimestamp(raw[1]).subtract(1, 'hours').toDate(),
				parseTimestamp(raw[1]).toDate()
		);
	});
}

module.exports = readMamacData;
