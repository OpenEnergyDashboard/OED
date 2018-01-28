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


	mocha.it('Compresses when raw data lines up with compressed data', async () => {
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
	});

	mocha.it('Compresses when raw data does not line up with compressed data', async () => {
		await Reading.insertAll([
			new Reading(meter.id, 100, timestamp1, timestamp2),
			new Reading(meter.id, 200, timestamp2, timestamp3),
			new Reading(meter.id, 300, timestamp3, timestamp4),
			new Reading(meter.id, 400, timestamp4, timestamp5)
		]);
		await Reading.refreshCompressedReadings();
		const { meter_id, reading_rate, time_interval } = await db.one('SELECT * FROM daily_readings WHERE time_interval && tsrange(${start_timestamp}, ${end_timestamp});',
			{ start_timestamp: timestamp1, end_timestamp: timestamp2 });
		expect(meter_id).to.equal(meter.id);
		expect(reading_rate).to.equal((100 + 200 + 300 + 400) / 4);
	});

	mocha.it('Compresses when raw data overlaps compressed ranges badly', async () => {
		const startOfDay = moment('2018-01-01');
		const halfHourBefore = startOfDay.clone().subtract(30, 'minutes');
		const halfHourAfter = startOfDay.clone().add(30, "minutes");
		await Reading.insertAll([
			new Reading(meter.id, 100, halfHourBefore, halfHourAfter)
		]);

		await Reading.refreshCompressedReadings();
		const rows = await db.many('SELECT * FROM daily_readings;');
		expect(rows).to.have.length(2);
		expect(rows[0].meter_id).to.equal(meter.id);
		expect(rows[1].meter_id).to.equal(meter.id);

		expect(rows[0].reading_rate).to.equal(100);
		expect(rows[1].reading_rate).to.equal(100);
	});

	mocha.it('Compresses two readings of unequal length that are not fully contained in an interval', async () => {
		const day1Start = moment('2018-01-01');
		const day2Start = moment('2018-01-02');

		await Reading.insertAll([
			new Reading(meter.id, 100, day1Start.clone().subtract(1, 'hour'), day1Start.clone().add(1, 'hour')),
			new Reading(meter.id, 400, day2Start.clone().subtract(2, 'hours'), day2Start.clone().add(2, 'hours'))
		]);

		// First reading: 100 kWh over 2 hours = 50 kW, 1 hour of overlap with the time interval
		// Second reading: 400 kwH over 4 hours = 100 kW, 2 hours of overlap with the time interval

		// Expected compressed reading:
		// ((50 kW * 1 hr) + (100 kW * 2 hr)) / (1 hr + 2 hr)

		await Reading.refreshCompressedReadings();

		const { meter_id, reading_rate, time_interval } = await db.one('SELECT * FROM daily_readings WHERE lower(time_interval) = ${start_timestamp};',
			{ start_timestamp: day1Start });

		expect(meter_id).to.equal(meter.id);
		expect(reading_rate).to.be.closeTo(((50 * 1) + (100 * 2)) / (1 + 2), 0.0001);
	});
});
