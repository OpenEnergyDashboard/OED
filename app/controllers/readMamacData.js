const reqPromise = require('request-promise-native');
const promisify = require('es6-promisify');
const csv = require('csv');
const parseCsv = promisify(csv.parse);
const moment = require('moment');

const Reading = require('./../../models/Reading');

function parseTimestamp(raw) {
	return moment(raw, 'HH:mm:ss MM/DD/YY').format('YYYY-MM-DD HH:mm:ss');
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
		.then(meter => {
				if (!meter.ipAddress) throw new Error(`${meter} doesn't have an IP address to read data from`);
				return meter;
			}
		).then(meter => Promise.all([
			Promise.resolve(meter),
			reqPromise(`http://${meter.ipAddress}/int2.csv`).then(parseCsv)
		])).then(([meter, rawReadings]) => {
			if (!meter.id) throw new Error(`${meter} doesn't have an id to associate readings with`);
			return rawReadings.map(raw => new Reading(meter.id, parseInt(raw[0]), parseTimestamp(raw[1])));
		})
}

module.exports = readMamacData;