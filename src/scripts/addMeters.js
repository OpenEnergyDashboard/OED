// Script to add meters from a .xlsx file

const XLSX = require('xlsx');

// Get IPs
function parseXLSX(filename) {
	const workbook = XLSX.readFile(filename);
	// This isn't a property so we don't want dot-notation
	const worksheet = workbook.Sheets['Sheet1']; // eslint-disable-line dot-notation
	return XLSX.utils.sheet_to_json(worksheet);
}

const ips = parseXLSX('This should be a filename');

// get information about meters from IPs

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
	// ----------------id-------name---ip--enabled--type
	return new Meter(undefined, name, ip, true, Meter.type.MAMAC);
}

function makeURL (){
	return ips.map(ip => getMeterInfo(`http://${ip.ip}/sm101.xml`, ip.ip));
}
