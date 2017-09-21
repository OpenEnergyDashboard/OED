/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');

chai.use(chaiAsPromised);
const expect = chai.expect;

const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');

const mocha = require('mocha');

mocha.describe('Compressed Readings 2', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	const timestamp1 = moment('2017-01-01');
	const timestamp2 = timestamp1.clone().add(1, 'hour');
	const timestamp3 = timestamp2.clone().add(1, 'hour');
	const timestamp4 = timestamp3.clone().add(1, 'hour');
	const timestamp5 = timestamp4.clone().add(1, 'hour');

	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});


	mocha.it('Compresses correctly', async () => {
		await Reading.insertAll([
			new Reading(meter.id, 100, timestamp1, timestamp2),
			new Reading(meter.id, 200, timestamp2, timestamp3),
			new Reading(meter.id, 300, timestamp3, timestamp4),
			new Reading(meter.id, 400, timestamp4, timestamp5)
		]);
		await Reading.refreshCompressedReadings();
		const { meter_id, reading_rate, time_interval } = await db.one('SELECT * FROM hourly_readings WHERE lower(time_interval)=${start_timestamp};',
			{ start_timestamp: timestamp1 });
		expect(meter_id).to.equal(meter.id);
		expect(reading_rate).to.equal(100);
	}
	);
});
