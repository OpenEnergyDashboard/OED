const reqPromise = require('request-promise-native');
const promisify = require('es6-promisify');
const csv = require('csv');
const moment = require('moment');
const Reading = require('../models/Reading');

const parseCsv = promisify(csv.parse);

function parseTimestamp(raw) {
	return moment(raw, 'HH:mm:ss MM/DD/YY');
}

/**
 * Returns a promise containing all the readings currently stored on the given meter's hardware.
 * The promise will reject if the meter doesn't have an IP address.
 * @param meter
 * @returns {Promise.<array.<Reading>>}
 */
function readMamacData(meter) {
	// First get a promise that's just the meter itself (or an error if it doesn't have an IP address)
	return Promise.resolve(meter)
		.then(m => {
			if (!m.ipAddress) throw new Error(`${m} doesn't have an IP address to read data from`);
			return m;
		}).then(m => Promise.all([
			Promise.resolve(m),
			reqPromise(`http://${m.ipAddress}/int2.csv`).then(parseCsv)
		])).then(([m, rawReadings]) => {
			if (!m.id) throw new Error(`${m} doesn't have an id to associate readings with`);
			return rawReadings.map(raw => new Reading(
				m.id,
				parseInt(raw[0]),
				parseTimestamp(raw[1]).subtract(1, 'hours').toDate(),
				parseTimestamp(raw[1]).toDate())
			);
		});
}

module.exports = readMamacData;
