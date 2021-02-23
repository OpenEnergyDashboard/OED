/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ini = require('ini');
const Meter = require('../../models/Meter');
const ConfigFile = require('../../models/obvius/Configfile');

/**
 * Creates array of meters from a config file
 * @param {ConfigFile} configFile
 * @returns {Meter[]} an array of Meter objects
 */
function processConfigFile(configFile) {
	const config = ini.parse(configFile.contents);
	const regularExpression = /([0-9][0-9])/;
	// For the metersHash we assume each key corresponds
	// to a hash of structure { NAME: <alternative name>, UNITS: <units>, LOW:<>, HIGHT:<>, CONSOLE:<> }
	const metersHash = {};
	// Array of Meter (from models) objects
	const metersArray = [];
	for (key of Object.keys(config)) {
		const [, meterNumber, characteristic] = key.split(regularExpression);
		const internalMeterName = `${configFile.serialId}.${parseInt(meterNumber)}`;
		const meter = metersHash[internalMeterName];
		metersHash[internalMeterName] = { ...meter, [characteristic]: config[key] };
	}
	for (internalMeterName of Object.keys(metersHash)) {
		metersArray.push(new Meter(
			undefined,
			internalMeterName,
			undefined,
			false,
			false,
			Meter.type.OBVIUS,
			null,
			metersHash[internalMeterName].NAME));
	}
	return metersArray;
}

module.exports = {
	processConfigFile
};
