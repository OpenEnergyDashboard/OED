/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const { mocha, expect, testDB } = require('../common');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const Group = require('../../models/Group');
const Point = require('../../models/Point');
const { generateSineData } = require('../../data/generateTestingData');
const gps = new Point(90, 45);

mocha.describe('Compressed Readings 2', () => {
	// Set reading rate in case changed at site.
	process.env.OED_SITE_READING_RATE = process.env.OED_TEST_SITE_READING_RATE;

	mocha.describe('Compressed meter readings', () => {
		let meter;
		// Need to work in UTC time since that is what the database returns and comparing
		// to database values. Done in all moment objects in this test.
		const timestamp1 = moment.utc('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const timestamp5 = timestamp4.clone().add(1, 'hour');
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
			meter = await Meter.getByName('Meter', conn);
		});


		mocha.it('Compresses when raw data lines up with compressed data', async () => {
			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			await Reading.refreshCompressedReadings(conn);

			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshCompressedHourlyReadings(conn);
			const { meter_id, reading_rate } = await conn.one('SELECT * FROM hourly_readings WHERE lower(time_interval)=${start_timestamp};',
				{ start_timestamp: timestamp1 });
			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.equal(100);
		});

		mocha.it('Compresses when raw data does not line up with compressed data', async () => {
			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			await Reading.refreshCompressedReadings(conn);
			const { meter_id, reading_rate } = await conn.one(
				'SELECT * FROM daily_readings WHERE time_interval && tsrange(${start_timestamp}, ${end_timestamp});',
				{ start_timestamp: timestamp1, end_timestamp: timestamp2 });
			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.equal((100 + 200 + 300 + 400) / 4);
		});

		mocha.it('Compresses when raw data overlaps compressed ranges badly', async () => {
			const conn = testDB.getConnection();
			const startOfDay = moment.utc('2018-01-01');
			const halfHourBefore = startOfDay.clone().subtract(30, 'minutes');
			const halfHourAfter = startOfDay.clone().add(30, 'minutes');
			await Reading.insertAll([
				new Reading(meter.id, 100, halfHourBefore, halfHourAfter)
			], conn);

			await Reading.refreshCompressedReadings(conn);
			const rows = await conn.many('SELECT * FROM daily_readings;');
			expect(rows).to.have.length(2);
			expect(rows[0].meter_id).to.equal(meter.id);
			expect(rows[1].meter_id).to.equal(meter.id);

			expect(rows[0].reading_rate).to.equal(100);
			expect(rows[1].reading_rate).to.equal(100);
		});

		mocha.it('Compresses two readings of unequal length that are not fully contained in an interval', async () => {
			const day1Start = moment.utc('2018-01-01');
			const day2Start = moment.utc('2018-01-02');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, day1Start.clone().subtract(1, 'hour'), day1Start.clone().add(1, 'hour')),
				new Reading(meter.id, 400, day2Start.clone().subtract(2, 'hours'), day2Start.clone().add(2, 'hours'))
			], conn);

			// First reading: 100 kWh over 2 hours = 50 kW, 1 hour of overlap with the time interval
			// Second reading: 400 kwH over 4 hours = 100 kW, 2 hours of overlap with the time interval

			// Expected compressed reading:
			// ((50 kW * 1 hr) + (100 kW * 2 hr)) / (1 hr + 2 hr)

			await Reading.refreshCompressedReadings(conn);

			const { meter_id, reading_rate } = await conn.one('SELECT * FROM daily_readings WHERE lower(time_interval) = ${start_timestamp};',
				{ start_timestamp: day1Start });

			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.be.closeTo(((50 * 1) + (100 * 2)) / (1 + 2), 0.0001);
		});

		mocha.it('Works correctly in Reading.getNewCompressedReadings()', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(1, 'day');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);

			const meterReadings = await Reading.getNewCompressedReadings([meter.id], dayStart, dayEnd, conn);

			expect(Object.keys(meterReadings).length).to.equal(1);
			const readingsForMeter = meterReadings[meter.id];

			// The data returned is daily data rather than minute data.
			for (reading of readingsForMeter) {
				const duration = moment.duration(reading.end_timestamp.diff(reading.start_timestamp));
				// Since the interval is one day, compressed readings returns raw data.
				expect(duration.asMilliseconds()).to.equal(moment.duration(1, 'day').asMilliseconds());
				// 100 kWh over a day is 100/24 kW.
				expect(reading.reading_rate).to.be.closeTo(100 / 24, 0.00001);
			}

			expect(readingsForMeter.length).to.equal(1);
		});

		mocha.it('Retrieves the correct number of readings when asked for a short interval', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(15, 'minute');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);

			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshCompressedHourlyReadings(conn);

			const meterReadings = await Reading.getNewCompressedReadings([meter.id], dayStart, dayStart.clone().add(15, 'minute'), conn);

			expect(meterReadings[meter.id].length).to.equal(1);
			expect(meterReadings[meter.id][0].reading_rate).to.equal(100 / (15 / 60));
		});

		mocha.it('Retrieves the correct number of readings when asked for a long interval', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(15, 'minute');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);

			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshCompressedHourlyReadings(conn);

			const meterReadings = await Reading.getNewCompressedReadings([meter.id], dayStart, dayStart.clone().add(1, 'hours').toString(), conn);
			expect(meterReadings[meter.id].length).to.equal(1);
			expect(meterReadings[meter.id][0].reading_rate).to.equal(100 / (15 / 60));
		});

		mocha.it('Retrieves the correct type of readings when asked for an hour-resolution interval', async () => {
			const yearStart = moment.utc('2018-01-01');
			const yearEnd = yearStart.clone().add(15, 'minute');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, yearStart, yearEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);
			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshCompressedHourlyReadings(conn);

			const allReadings = await Reading.getNewCompressedReadings([meter.id], yearStart, yearStart.clone().add(60, 'hours'), conn);
			const meterReadings = allReadings[meter.id];

			expect(meterReadings.length).to.equal(1);
			expect(meterReadings[0].reading_rate).to.equal(100 / (15 / 60));
		});
		mocha.it('Retrieves the correct type of readings when asked for a day-resolution interval', async () => {
			const yearStart = moment.utc('2018-01-01');
			const yearEnd = yearStart.clone().add(15, 'minute');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, yearStart, yearEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);
			const allReadings = await Reading.getNewCompressedReadings([meter.id], yearStart, yearStart.clone().add(60, 'days'), conn);
			const meterReadings = allReadings[meter.id];
			expect(meterReadings.length).to.equal(1);
			expect(meterReadings[0].reading_rate).to.equal(100 / (15 / 60));
		});

		mocha.describe('Compression for underlying 15-minute data:', () => {
			let meter1;
			const startDate = '2020-01-01 00:00:00';
			const endDate = '2020-04-01 00:00:00';
			mocha.beforeEach(async function () {
				this.timeout(20000); // extend timeout because refreshes take a longer time.
				const conn = testDB.getConnection();
				await new Meter(undefined, 'Meter1', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
				meter1 = await Meter.getByName('Meter1', conn);
				const data = generateSineData(startDate, endDate, { timeStep: { minute: 15 } }).map(row => new Reading(meter1.id, row[0], row[1], row[2]));
				await Reading.insertAll(data, conn);
				await Reading.refreshCompressedReadings(conn);

				// We need to refresh the hourly readings view because it is materialized.
				await Reading.refreshCompressedHourlyReadings(conn);
			});

			mocha.it('Daily resolution:', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(61, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				expect(allReadings['2'].length).to.greaterThan(61); // more data will be returned because of shift down to the hour view.
			})

			mocha.it('Hour resolution', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(61, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				expect(allReadings['2'].length).to.equal(24 * 61);
			});

			mocha.it('Raw resolution', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(14, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				const hourToRawScaleFactor = 4; // This is four since there are four 15-minute intervals in one hour.
				expect(allReadings['2'].length).to.equal(14 * 24 * hourToRawScaleFactor);
			});
		});

		mocha.describe('Compression for underlying 23-minute data:', () => {
			let meter1;
			const startDate = '2020-01-01 00:00:00';
			const endDate = '2020-04-01 00:00:00';
			mocha.beforeEach(async function () {
				this.timeout(20000); // extend timeout because refreshes take a longer time.
				const conn = testDB.getConnection();
				await new Meter(undefined, 'Meter1', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
				meter1 = await Meter.getByName('Meter1', conn);
				const data = generateSineData(startDate, endDate, { timeStep: { minute: 23 } }).map(row => new Reading(meter1.id, row[0], row[1], row[2]));
				await Reading.insertAll(data, conn);
				await Reading.refreshCompressedReadings(conn);

				// We need to refresh the hourly readings view because it is materialized.
				await Reading.refreshCompressedHourlyReadings(conn);
			});

			mocha.it('Daily resolution:', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(61, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				expect(allReadings['2'].length).to.greaterThan(61); // more data will be returned because of shift down to the hour view.
			});

			mocha.it('Hour resolution', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(61, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				expect(allReadings['2'].length).to.equal(24 * 61);
			});

			mocha.it('Raw resolution', async () => {
				const start = moment.utc(startDate);
				const end = moment.utc(startDate).clone();
				end.add(14, 'days');
				const allReadings = await Reading.getNewCompressedReadings([meter1.id], start, end, conn);
				const hourToRawScaleFactor = 1 / (moment.duration('00:23:00').asHours()); // The number of 23-minute intervals in one hour.
				expect(allReadings['2'].length).to.be.closeTo(14 * 24 * hourToRawScaleFactor, 1);
			});
		});

		mocha.it('Correctly shrinks infinite intervals', async () => {
			// TODO: Test infinite range with bounded timestamp to ensure proper shrink
			const yearStart = moment.utc('2018-01-01');
			const yearEnd = yearStart.clone().add(1, 'year');

			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, yearStart, yearEnd)
			], conn);

			await Reading.refreshCompressedReadings(conn);
			const allReadings = await Reading.getNewCompressedReadings([meter.id], null, null, conn);
			const meterReadings = allReadings[meter.id];
			expect(meterReadings.length).to.equal(365); // 365 days in a year
			const aRow = meterReadings[0];
			const rowWidth = moment.duration(aRow.end_timestamp.diff(aRow.start_timestamp));
			expect(rowWidth.asDays()).to.equal(1);
		});
	});

	mocha.describe('Compressed group readings', () => {
		// Set up some meters and groups to use in tests
		let meter1;
		let meter2;
		let group1;
		let group2;
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			await new Meter(undefined, 'Meter1', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
			await new Meter(undefined, 'Meter2', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
			meter1 = await Meter.getByName('Meter1', conn);
			meter2 = await Meter.getByName('Meter2', conn);

			await new Group(undefined, 'Group1').insert(conn);
			await new Group(undefined, 'Group2').insert(conn);

			group1 = await Group.getByName('Group1', conn);
			group2 = await Group.getByName('Group2', conn);
		});

		mocha.it('Compresses readings across meters for the same group', async () => {
			const startOfDay = moment.utc('2018-01-01');

			const conn = testDB.getConnection();
			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			], conn);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id, conn);
			await group1.adoptMeter(meter2.id, conn);

			const groupReadings = await Reading.getNewCompressedGroupReadings(
				[group1.id], startOfDay, startOfDay.clone().add(1, 'hour'), conn
			);

			expect(Object.keys(groupReadings).length).to.equal(1);
			const readingsForGroup = groupReadings[group1.id];

			// Compressed readings serves data from the raw view, which only
			// has one data point for this interval. This is changed from
			// the previous system which would generate 60 points for each minute.
			expect(readingsForGroup.length).to.equal(1);
		});

		mocha.it('Compresses when two groups have different meters', async () => {
			const startOfDay = moment.utc('2018-01-01');

			const conn = testDB.getConnection();
			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			], conn);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id, conn);
			await group2.adoptMeter(meter2.id, conn);

			const groupReadings = await Reading.getNewCompressedGroupReadings(
				[group1.id, group2.id], startOfDay, startOfDay.clone().add(1, 'hour'), conn
			);

			expect(Object.keys(groupReadings).length).to.equal(2);
			const readingsForG1 = groupReadings[group1.id];
			const readingsForG2 = groupReadings[group2.id];

			// Compressed readings serves data from the raw view, which only
			// has one data point for this interval. This is changed from
			// the previous system which would generate 60 points for each minute.
			expect(readingsForG1.length).to.equal(1);
			expect(readingsForG2.length).to.equal(1);
		});
	});

	mocha.describe('Compressed meter barchart readings', () => {
		let meter;
		let meter2;
		const timestamp1 = moment.utc('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'day');
		const timestamp3 = timestamp2.clone().add(1, 'day');
		const timestamp4 = timestamp3.clone().add(1, 'day');
		const timestamp5 = timestamp4.clone().add(1, 'day');
		mocha.beforeEach(async () => {
			const conn = testDB.getConnection();
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
			meter = await Meter.getByName('Meter', conn);
			await new Meter(undefined, 'Meter2', null, false, true, Meter.type.MAMAC, null, gps).insert(conn);
			meter2 = await Meter.getByName('Meter2', conn);
		});

		mocha.it('Retrieves the correct interval for a single meter and day width', async () => {
			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			await Reading.refreshCompressedReadings(conn);

			const barReadings = await Reading.getNewCompressedBarchartReadings([meter.id], timestamp1, timestamp5, 1, conn);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);

			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 100, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() },
				{ reading: 200, start_timestamp: timestamp2.valueOf(), end_timestamp: timestamp3.valueOf() },
				{ reading: 300, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp4.valueOf() },
				{ reading: 400, start_timestamp: timestamp4.valueOf(), end_timestamp: timestamp5.valueOf() }
			]);
		});

		mocha.it('Retrieves the correct interval for a single meter and multiple days width', async () => {
			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			await Reading.refreshCompressedReadings(conn);

			const barReadings = await Reading.getNewCompressedBarchartReadings([meter.id], timestamp1, timestamp5, 2, conn);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 300, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp3.valueOf() },
				{ reading: 700, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp5.valueOf() }
			]);
		});

		mocha.it('Retrieves the correct barchart readings for multiple meters', async () => {
			const conn = testDB.getConnection();
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter2.id, 1, timestamp1, timestamp2)
			], conn);
			await Reading.refreshCompressedReadings(conn);
			const barReadings = await Reading.getNewCompressedBarchartReadings([meter.id, meter2.id], timestamp1, timestamp2, 1, conn);
			expect(barReadings).to.have.keys([meter.id.toString(), meter2.id.toString()]);
			const readingsForMeterComparable = barReadings[meter.id].map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			const readingsForMeter2Comparable = barReadings[meter2.id].map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 100, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() }
			]);
			expect(readingsForMeter2Comparable).to.deep.equal([
				{ reading: 1, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() }
			]);
		});
	});
});
