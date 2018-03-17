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
const Group = require('../../models/Group');

const mocha = require('mocha');

mocha.describe('Compressed Readings 2', () => {

	mocha.describe('Compressed meter readings', () => {
		let meter;
		const timestamp1 = moment('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const timestamp5 = timestamp4.clone().add(1, 'hour');
		mocha.beforeEach(recreateDB);
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
			const { meter_id, reading_rate } = await db.one('SELECT * FROM hourly_readings WHERE lower(time_interval)=${start_timestamp};',
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
			const { meter_id, reading_rate } = await db.one('SELECT * FROM daily_readings WHERE time_interval && tsrange(${start_timestamp}, ${end_timestamp});',
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

			const { meter_id, reading_rate } = await db.one('SELECT * FROM daily_readings WHERE lower(time_interval) = ${start_timestamp};',
				{ start_timestamp: day1Start });

			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.be.closeTo(((50 * 1) + (100 * 2)) / (1 + 2), 0.0001);
		});

		mocha.it('Works correctly in Reading.getNewCompressedReadings()', async () => {
			const dayStart = moment('2018-01-01');
			const dayEnd = dayStart.clone().add(1, 'day');

			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			]);

			await Reading.refreshCompressedReadings();

			const meterReadings = await Reading.getNewCompressedReadings([meter.id], dayStart, dayEnd);

			expect(Object.keys(meterReadings).length).to.equal(1);
			const readingsForMeter = meterReadings[meter.id];

			for (reading of readingsForMeter) {
				const duration = moment.duration(reading.end_timestamp.diff(reading.start_timestamp));
				expect(duration.asMilliseconds()).to.equal(moment.duration(1, 'minute').asMilliseconds());
				expect(reading.reading_rate).to.be.closeTo(100 / 24, 0.00001)
			}
		});
	});

	mocha.describe('Compressed group readings', () => {
		// Set up some meters and groups to use in tests
		let meter1;
		let meter2;
		let group1;
		let group2;
		mocha.beforeEach(recreateDB);
		mocha.beforeEach(async () => {
			await new Meter(undefined, 'Meter1', null, false, Meter.type.MAMAC).insert();
			await new Meter(undefined, 'Meter2', null, false, Meter.type.MAMAC).insert();
			meter1 = await Meter.getByName('Meter1');
			meter2 = await Meter.getByName('Meter2');

			await new Group(undefined, 'Group1').insert();
			await new Group(undefined, 'Group2').insert();

			group1 = await Group.getByName('Group1');
			group2 = await Group.getByName('Group2');
		});

		mocha.it('Compresses readings across meters for the same group', async () => {
			const startOfDay = moment('2018-01-01');

			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			]);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id);
			await group1.adoptMeter(meter2.id);

			const groupReadings = await Reading.getNewCompressedGroupReadings(
				[group1.id], startOfDay, startOfDay.clone().add(1, 'hour')
			);

			expect(Object.keys(groupReadings).length).to.equal(1);
			const readingsForGroup = groupReadings[group1.id];

			expect(readingsForGroup.length).to.equal(1 * 60); // Minute compression, 1 hour duration
		});

		mocha.it('Compresses when two groups have different meters', async () => {
			const startOfDay = moment('2018-01-01');

			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			]);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id);
			await group2.adoptMeter(meter2.id);

			const groupReadings = await Reading.getNewCompressedGroupReadings(
				[group1.id, group2.id], startOfDay, startOfDay.clone().add(1, 'hour')
			);

			expect(Object.keys(groupReadings).length).to.equal(2);
			const readingsForG1 = groupReadings[group1.id];
			const readingsForG2 = groupReadings[group2.id];

			expect(readingsForG1.length).to.equal(1 * 60); // Minute compression, 1 hour duration
			expect(readingsForG2.length).to.equal(1 * 60); // Minute compression, 1 hour duration
		});
	});

	mocha.describe('Compressed meter barchart readings', () => {
		let meter;
		let meter2;
		const timestamp1 = moment('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'day');
		const timestamp3 = timestamp2.clone().add(1, 'day');
		const timestamp4 = timestamp3.clone().add(1, 'day');
		const timestamp5 = timestamp4.clone().add(1, 'day');
		mocha.beforeEach(recreateDB);
		mocha.beforeEach(async () => {
			await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
			meter = await Meter.getByName('Meter');
			await new Meter(undefined, 'Meter2', null, false, Meter.type.MAMAC).insert();
			meter2 = await Meter.getByName('Meter2');
		});

		mocha.it('Retrieves the correct interval for a single meter and day width', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			]);
			await Reading.refreshCompressedReadings();

			const barReadings = await Reading.getNewCompressedBarchartReadings([meter.id], timestamp1, timestamp5, 1);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({reading, start_timestamp, end_timestamp}) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf()})
			);

			expect(readingsForMeterComparable).to.deep.equal([
				{reading: 100, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf()},
				{reading: 200, start_timestamp: timestamp2.valueOf(), end_timestamp: timestamp3.valueOf()},
				{reading: 300, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp4.valueOf()},
				{reading: 400, start_timestamp: timestamp4.valueOf(), end_timestamp: timestamp5.valueOf()}
			])
		});

		mocha.it('Retrieves the correct interval for a single meter and multiple days width', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			]);
			await Reading.refreshCompressedReadings();

			const barReadings = await Reading.getNewCompressedBarchartReadings([meter.id], timestamp1, timestamp5, 2);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({reading, start_timestamp, end_timestamp}) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf()})
			);
			expect(readingsForMeterComparable).to.deep.equal([
				{reading: 300, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp3.valueOf()},
				{reading: 700, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp5.valueOf()}
			])
		});

	});
});
