/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');
const _ = require('lodash');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const updateAllMeters = require('../../services/updateMeters');
const mocha = require('mocha');
const sinon = require('sinon');


async function testUpdateAllMeters() {
	await recreateDB();

	const goodMeter = new Meter(undefined, 'GOOD', 1, true, Meter.type.MAMAC);
	await goodMeter.insert();

	const badMeter = new Meter(undefined, 'BAD', 2, true, Meter.type.MAMAC);
	await badMeter.insert();

	// console.log(goodMeter);
	const readMamacData = sinon.stub();
	readMamacData.withArgs(sinon.match({
		id: goodMeter.id,
		name: goodMeter.name,
		ipAddress: goodMeter.ipAddress,
		enabled: goodMeter.enabled,
		type: goodMeter.type })
	).resolves(new Reading(
		goodMeter.id,
		0,
		moment('1970-01-01 00:00:00'),
		moment('1970-01-01 01:00:00')
	));
	readMamacData.withArgs(_.cloneDeep(badMeter)).rejects(new Error("shit's on fire, yo."));
	readMamacData.returns('hello');


	console.log([goodMeter, badMeter].map(readMamacData));

	await updateAllMeters(readMamacData);
	console.log(readMamacData.called);
	const goodReadings = await Reading.getAllByMeterID(goodMeter.id);
	const badReadings = await Reading.getAllByMeterID(badMeter.id);
	console.log(goodReadings);
}

testUpdateAllMeters();
