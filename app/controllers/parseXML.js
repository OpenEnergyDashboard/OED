const parseString = require('xml2js').parseString;
const parseXLSX = require('./parseXLSX.js');

const Meter = require('./../../models/Meter');
const reqPromise = require('request-promise-native');
const promisify = require('es6-promisify');

const parseXMLPromisified = promisify(parseString);

// Get all the ips from the xlsx file.
const ips = parseXLSX.parseXLSX('ips.xlsx');

/**
 * Creates a promise to create a Mamac meter based on a URL to grab XML from and an IP address for the meter.
 *
 * The URL should be formed from the IP address.
 * @param url The url to retrieve meter info from.
 * @param ip The ip of the meter being created
 * @returns {Promise.<Meter>}
 */
function promiseRetrieveMeterFromUrlAndIp(url, ip) {
	return reqPromise(url)
		.then(raw => parseXMLPromisified(raw))
		.then(xml => {
			const name = xml.Maverick.NodeID[0];
			return new Meter(undefined, name, ip);
		});
}

/**
 * Gets an array of promises for each meter represented in ips.xlsx
 * @returns {Array<Promise<Meter>>}
 */
function allMetersPromises() {
	return ips.map(ip => promiseRetrieveMeterFromUrlAndIp(`http://${ip.ip}/sm101.xml`, ip.ip));
}

exports.allMeters = allMetersPromises;
// parseAll();
