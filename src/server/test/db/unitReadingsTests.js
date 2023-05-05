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
const { generateSineData } = require('../../data/generateTestingData');
const Unit = require('../../models/Unit');
const Conversion = require('../../models/Conversion');
const { insertStandardUnits, insertStandardConversions } = require('../../util/insertData');
const { insertSpecialUnits, insertSpecialConversions } = require('../../data/automatedTestingData');
const { redoCik } = require('../../services/graph/redoCik');

// TODO add tests that check flow readings.

mocha.describe('Line & bar Readings', () => {
	mocha.describe('Check daily and hourly reading views', () => {
		let meter, conn;
		// Need to work in UTC time since that is what the database returns and comparing
		// to database values. Done in all moment objects in this test.
		const timestamp1 = moment.utc('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const timestamp5 = timestamp4.clone().add(1, 'hour');

		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			// Insert the special units. Really only need 1-2 but this is easy.
			await insertSpecialUnits(conn);
			// Make the meter be a kWh meter.
			const meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '01:00:00').insert(conn);
			meter = await Meter.getByName('Meter', conn);
		});

		mocha.it('Hourly readings when readings line up with hour', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			// Refresh the hourly readings view because it is materialized.
			await Reading.refreshHourlyReadings(conn);
			const { meter_id, reading_rate } = await conn.one('SELECT * FROM hourly_readings_unit WHERE lower(time_interval)=${start_timestamp};',
				{ start_timestamp: timestamp1 });
			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.equal(100);
		});

		mocha.it('Daily readings when readings line up with hour for part of day', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			await Reading.refreshDailyReadings(conn);
			const { meter_id, reading_rate } = await conn.one(
				'SELECT * FROM daily_readings_unit WHERE time_interval && tsrange(${start_timestamp}, ${end_timestamp});',
				{ start_timestamp: timestamp1, end_timestamp: timestamp2 });
			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.equal((100 + 200 + 300 + 400) / 4);
		});

		mocha.it('Daily readings when one reading half hour half hour before/after start of day', async () => {
			const startOfDay = moment.utc('2018-01-01');
			const halfHourBefore = startOfDay.clone().subtract(30, 'minutes');
			const halfHourAfter = startOfDay.clone().add(30, 'minutes');
			await Reading.insertAll([
				new Reading(meter.id, 100, halfHourBefore, halfHourAfter)
			], conn);

			await Reading.refreshDailyReadings(conn);
			const rows = await conn.many('SELECT * FROM daily_readings_unit;');
			expect(rows).to.have.length(2);
			expect(rows[0].meter_id).to.equal(meter.id);
			expect(rows[1].meter_id).to.equal(meter.id);

			expect(rows[0].reading_rate).to.equal(100);
			expect(rows[1].reading_rate).to.equal(100);
		});

		mocha.it('Daily readings with two readings of unequal length that overlap start and end of day', async () => {
			const day1Start = moment.utc('2018-01-01');
			const day2Start = moment.utc('2018-01-02');

			await Reading.insertAll([
				new Reading(meter.id, 100, day1Start.clone().subtract(1, 'hour'), day1Start.clone().add(1, 'hour')),
				new Reading(meter.id, 400, day2Start.clone().subtract(2, 'hours'), day2Start.clone().add(2, 'hours'))
			], conn);

			// First reading: 100 kWh over 2 hours = 50 kW, 1 hour of overlap with the time interval
			// Second reading: 400 kwH over 4 hours = 100 kW, 2 hours of overlap with the time interval

			// Expected compressed reading:
			// ((50 kW * 1 hr) + (100 kW * 2 hr)) / (1 hr + 2 hr)

			await Reading.refreshDailyReadings(conn);

			const { meter_id, reading_rate } = await conn.one('SELECT * FROM daily_readings_unit WHERE lower(time_interval) = ${start_timestamp};',
				{ start_timestamp: day1Start });

			expect(meter_id).to.equal(meter.id);
			expect(reading_rate).to.be.closeTo(((50 * 1) + (100 * 2)) / (1 + 2), 0.0001);
		});
	});

	// mocha.describe('Check intervals', () => {
	// 	let meter, graphicUnitId, conn;

	// 	mocha.beforeEach(async function () {
	// 		conn = testDB.getConnection();
	// 		// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
	// 		await insertStandardUnits(conn);
	// 		await insertStandardConversions(conn);
	// 		await insertSpecialUnits(conn);
	// 		await insertSpecialConversions(conn);
	// 		await redoCik(conn);
	// 		// Make the meter be a kWh meter.
	// 		const meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
	// 		await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
	// 			undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '1 year').insert(conn);
	// 		meter = await Meter.getByName('Meter', conn);
	// 		// Make the graphic unit be MegaJoules.
	// 		graphicUnitId = (await Unit.getByName('MJ', conn)).id;
	// 	});

	// 	// TODO This test no longer does what is desired because so few readings will return the 1 raw point.
	// 	// Until we have an interface to allow setting the frequency desired this test is commented out.
	// 	mocha.it('Correctly shrinks infinite intervals', async () => {
	// 		// TODO: Test infinite range with bounded timestamp to ensure proper shrink
	// 		const yearStart = moment.utc('2018-01-01');
	// 		const yearEnd = yearStart.clone().add(1, 'year');

	// 		await Reading.insertAll([
	// 			new Reading(meter.id, 100, yearStart, yearEnd)
	// 		], conn);
	// 		// Refresh daily reading views.
	// 		await Reading.refreshDailyReadings(conn);
	// 		const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, null, null, conn);
	// 		const meterReadings = allReadings[meter.id];
	// 		expect(meterReadings.length).to.equal(365); // 365 days in a year
	// 		const aRow = meterReadings[0];
	// 		const rowWidth = moment.duration(aRow.end_timestamp.diff(aRow.start_timestamp));
	// 		expect(rowWidth.asDays()).to.equal(1);
	// 	});
	// });


	// TODO modify so checks values too.

	mocha.describe('Number of readings for underlying 15-minute data', () => {
		let meter, graphicUnitId, conn;
		const startDate = '2020-01-01 00:00:00';
		// Do 61 days which is what is needed.
		const endDate = '2020-03-02 00:00:00';

		mocha.beforeEach(async function () {
			// Extend timeout because a longer time with more data being created. The value is somewhat
			// arbitrary and can be made larger if you get timeouts.
			this.timeout(20000);
			conn = testDB.getConnection();
			// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			await insertSpecialUnits(conn);
			await insertSpecialConversions(conn);
			await redoCik(conn);
			// Make the meter be a kWh meter.
			const meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:15:00').insert(conn);
			meter = await Meter.getByName('Meter', conn);
			// Make the graphic unit be MegaJoules.
			graphicUnitId = (await Unit.getByName('MJ', conn)).id;
			const data = generateSineData(startDate, endDate, { timeStep: { minute: 15 } }).map(row => new Reading(meter.id, row[0], row[1], row[2]));
			await Reading.insertAll(data, conn);
			// Refresh daily and hourly reading views.
			await Reading.refreshDailyReadings(conn);
			await Reading.refreshHourlyReadings(conn);
		});

		mocha.it('Use Daily resolution when 61 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 61;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// The min days is 61 for daily so should get daily points so 61.
			expect(allReadings[meter.id].length).to.equal(numDays);
		})

		mocha.it('Use Daily resolution when 60 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 60;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// The min days is 61 for daily so should get numDays days of hourly readings.
			expect(allReadings[meter.id].length).to.equal(numDays * 24);
		});

		mocha.it('Use raw readings when 14 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 14;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// Min hourly points is 1440 * reading frequency in hours so 1440 * 0.25 = 360 hours or 15 days.
			// 14 days so expect 14 days * 24 hours/day * 60 min/hour / 15 min/reading = 1344 readings.
			// The formula below is equivalent.
			const hourToRawScaleFactor = 60 / 15;
			expect(allReadings[meter.id].length).to.equal(Math.floor(numDays * 24 * hourToRawScaleFactor));
		});
	});

	// TODO modify so checks values too.

	mocha.describe('Number of readings for underlying 23-minute data', () => {
		let meter, graphicUnitId, conn;
		const startDate = '2020-01-01 00:00:00';
		// Do 61 days which is what is needed.
		const endDate = '2020-03-02 00:00:00';

		mocha.beforeEach(async function () {
			// Extend timeout because a longer time with more data being created. The value is somewhat
			// arbitrary and can be made larger if you get timeouts.
			this.timeout(20000);
			conn = testDB.getConnection();
			// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			await insertSpecialUnits(conn);
			await insertSpecialConversions(conn);
			await redoCik(conn);
			// Make the meter be a kWh meter.
			const meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			// The default frequency of reading is 15-min so set to 23 for this meter.
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:23:00').insert(conn);
			meter = await Meter.getByName('Meter', conn);
			// Make the graphic unit be MegaJoules.
			graphicUnitId = (await Unit.getByName('MJ', conn)).id;
			const data = generateSineData(startDate, endDate, { timeStep: { minute: 23 } }).map(row => new Reading(meter.id, row[0], row[1], row[2]));
			await Reading.insertAll(data, conn);
			// Refresh daily and hourly reading views.
			await Reading.refreshDailyReadings(conn);
			await Reading.refreshHourlyReadings(conn);
		});

		mocha.it('Use Daily resolution when 61 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 61;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// The min days is 61 for daily so should get daily points so 61.
			expect(allReadings[meter.id].length).to.equal(numDays);
		})

		mocha.it('Use Daily resolution when 60 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 60;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// The min days is 61 for daily so should get numDays days of hourly readings.
			expect(allReadings[meter.id].length).to.equal(numDays * 24);
		});

		mocha.it('Use raw readings when 22 days', async () => {
			const start = moment.utc(startDate);
			const end = moment.utc(startDate).clone();
			const numDays = 22;
			end.add(numDays, 'days');
			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, start, end, conn);
			// Min hourly points is 1440 * reading frequency in hours so 1440 * 23/60 = 552 hours or 23 days.
			// 22 days so expect 22 days * 24 hours/day * 60 min/hour / 23 min/reading = 1377.39 readings
			// rounded down to 1377.
			// The formula below is equivalent.
			const hourToRawScaleFactor = 60 / 23;
			expect(allReadings[meter.id].length).to.equal(Math.floor(numDays * 24 * hourToRawScaleFactor));
		});
	});

	mocha.describe('Meter line readings', () => {
		let meter, graphicUnitId, conn;
		const timestamp1 = moment.utc('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'hour');
		const timestamp3 = timestamp2.clone().add(1, 'hour');
		const timestamp4 = timestamp3.clone().add(1, 'hour');
		const timestamp5 = timestamp4.clone().add(1, 'hour');

		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			await insertSpecialUnits(conn);
			await insertSpecialConversions(conn);
			await redoCik(conn);
			// Make the meter be a kWh meter.
			meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '01:00:00').insert(conn);
			meter = await Meter.getByName('Meter', conn);
			// Make the graphic unit be MegaJoules.
			graphicUnitId = (await Unit.getByName('MJ', conn)).id;
			// The conversion should be 3.6 from kWh -> MJ.
			conversionSlope = 3.6;
		});

		mocha.it('Retrieves 1 day reading when asked for 1 day interval so looking at daily readings', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(1, 'day');

			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			// We need to refresh the daily readings view because it is materialized.
			await Reading.refreshDailyReadings(conn);

			const meterReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, dayStart, dayEnd, conn);

			expect(Object.keys(meterReadings).length).to.equal(1);
			const readingsForMeter = meterReadings[meter.id];
			expect(readingsForMeter.length).to.equal(1);

			// The data returned is daily data rather than minute data.
			for (reading of readingsForMeter) {
				const duration = moment.duration(reading.end_timestamp.diff(reading.start_timestamp));
				// The duration should be one day.
				expect(duration.asMilliseconds()).to.equal(moment.duration(1, 'day').asMilliseconds());
				// 100 kWh over a day is 100/24 kW converted to MJ.
				expect(reading.reading_rate).to.be.closeTo(100 / 24 * conversionSlope, 0.00001);
			}
		});

		mocha.it('Retrieves 15 min reading when asked for 15 min interval so looking at raw readings', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(15, 'minute');

			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			const meterReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, dayStart, dayStart.clone().add(15, 'minute'), conn);

			expect(meterReadings[meter.id].length).to.equal(1);
			expect(meterReadings[meter.id][0].reading_rate).to.be.closeTo(100 / (15 / 60) * conversionSlope, 0.00001);
		});

		mocha.it('Retrieves 15 min reading when asked for 1 hour interval so looking at hourly readings', async () => {
			const dayStart = moment.utc('2018-01-01');
			const dayEnd = dayStart.clone().add(15, 'minute');

			await Reading.insertAll([
				new Reading(meter.id, 100, dayStart, dayEnd)
			], conn);

			await Reading.refreshDailyReadings(conn);

			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshHourlyReadings(conn);

			const meterReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, dayStart, dayStart.clone().add(1, 'hours').toString(), conn);
			expect(meterReadings[meter.id].length).to.equal(1);
			expect(meterReadings[meter.id][0].reading_rate).to.be.closeTo(100 / (15 / 60) * conversionSlope, 0.00001);
		});

		mocha.it('Retrieves 15 min reading when asked for 60 hour interval so looking at hourly readings', async () => {
			const yearStart = moment.utc('2018-01-01');
			const yearEnd = yearStart.clone().add(15, 'minute');

			await Reading.insertAll([
				new Reading(meter.id, 100, yearStart, yearEnd)
			], conn);

			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshHourlyReadings(conn);

			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, yearStart, yearStart.clone().add(60, 'hours'), conn);
			const meterReadings = allReadings[meter.id];
			expect(meterReadings.length).to.equal(1);
			expect(meterReadings[0].reading_rate).to.be.closeTo(100 / (15 / 60) * conversionSlope, 0.00001);
		});

		mocha.it('Retrieves 15 min reading when asked for 60 day interval so looking at daily readings', async () => {
			const yearStart = moment.utc('2018-01-01');
			const yearEnd = yearStart.clone().add(15, 'minute');

			await Reading.insertAll([
				new Reading(meter.id, 100, yearStart, yearEnd)
			], conn);

			// We need to refresh the daily readings view because it is materialized.
			await Reading.refreshDailyReadings(conn);

			const allReadings = await Reading.getMeterLineReadings([meter.id], graphicUnitId, yearStart, yearStart.clone().add(60, 'days'), conn);

			const meterReadings = allReadings[meter.id];
			expect(meterReadings.length).to.equal(1);
			expect(meterReadings[0].reading_rate).to.be.closeTo(100 / (15 / 60) * conversionSlope, 0.00001);
		});
	});

	mocha.describe('Group line readings', () => {
		let graphicUnitId, conn;
		// Set up some meters and groups to use in tests
		let meter1, meter2, group1, group2;

		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			await insertSpecialUnits(conn);
			await insertSpecialConversions(conn);
			await redoCik(conn);
			// Make the meter be a kWh meter.
			meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			await new Meter(undefined, 'Meter1', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:15:00').insert(conn);
			await new Meter(undefined, 'Meter2', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:15:00').insert(conn);
			meter1 = await Meter.getByName('Meter1', conn);
			meter2 = await Meter.getByName('Meter2', conn);

			await new Group(undefined, 'Group1').insert(conn);
			await new Group(undefined, 'Group2').insert(conn);

			group1 = await Group.getByName('Group1', conn);
			group2 = await Group.getByName('Group2', conn);

			// Make the graphic unit be MegaJoules.
			graphicUnitId = (await Unit.getByName('MJ', conn)).id;
		});

		mocha.it('Hourly readings with two meters in a group', async () => {
			const startOfDay = moment.utc('2018-01-01');

			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			], conn);
			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshHourlyReadings(conn);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id, conn);
			await group1.adoptMeter(meter2.id, conn);

			const groupReadings = await Reading.getGroupLineReadings(
				[group1.id], graphicUnitId, startOfDay, startOfDay.clone().add(1, 'hour'), conn
			);

			expect(Object.keys(groupReadings).length).to.equal(1);
			const readingsForGroup = groupReadings[group1.id];

			// Readings serves data from the raw view, which only
			// has one data point for this interval.
			expect(readingsForGroup.length).to.equal(1);
		});

		mocha.it('Compresses when two groups have different meters', async () => {
			const startOfDay = moment.utc('2018-01-01');

			// Each meter gets a reading. Meter1 is at 100 kw, Meter2 is at 200.
			await Reading.insertAll([
				new Reading(meter1.id, 100, startOfDay, startOfDay.clone().add(1, 'hour')),
				new Reading(meter2.id, 200, startOfDay, startOfDay.clone().add(1, 'hour'))
			], conn);
			// We need to refresh the hourly readings view because it is materialized.
			await Reading.refreshHourlyReadings(conn);

			// Associate both meters with a single group
			await group1.adoptMeter(meter1.id, conn);
			await group2.adoptMeter(meter2.id, conn);

			const groupReadings = await Reading.getGroupLineReadings(
				[group1.id, group2.id], graphicUnitId, startOfDay, startOfDay.clone().add(1, 'hour'), conn
			);

			expect(Object.keys(groupReadings).length).to.equal(2);
			const readingsForG1 = groupReadings[group1.id];
			const readingsForG2 = groupReadings[group2.id];

			// Readings serves data from the raw view, which only
			// has one data point for this interval.
			expect(readingsForG1.length).to.equal(1);
			expect(readingsForG2.length).to.equal(1);
		});

		// TODO check values and daily/hourly readings.
	});

	mocha.describe('meter barchart readings', () => {
		let graphicUnitId, conversionSlope, conn;
		let meter, meter2;
		const timestamp1 = moment.utc('2017-01-01');
		const timestamp2 = timestamp1.clone().add(1, 'day');
		const timestamp3 = timestamp2.clone().add(1, 'day');
		const timestamp4 = timestamp3.clone().add(1, 'day');
		const timestamp5 = timestamp4.clone().add(1, 'day');

		mocha.beforeEach(async () => {
			conn = testDB.getConnection();
			// Insert the standard and special units and conversions. Really only need 1-2 but this is easy.
			await insertStandardUnits(conn);
			await insertStandardConversions(conn);
			await insertSpecialUnits(conn);
			await insertSpecialConversions(conn);
			await redoCik(conn);
			// Make the meter be a kWh meter.
			meterUnitId = (await Unit.getByName('Electric_Utility', conn)).id;
			await new Meter(undefined, 'Meter', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:15:00').insert(conn);
			meter = await Meter.getByName('Meter', conn);
			await new Meter(undefined, 'Meter2', null, false, true, Meter.type.OTHER, 'CST', undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, meterUnitId, meterUnitId, undefined, '00:15:00').insert(conn);
			meter2 = await Meter.getByName('Meter2', conn);
			// Make the graphic unit be MegaJoules.
			graphicUnitId = (await Unit.getByName('MJ', conn)).id;
			// The conversion should be 3.6 from kWh -> MJ.
			conversionSlope = 3.6;
		});

		mocha.it('Retrieves the correct interval for a single meter and day width', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			// We need to refresh the daily readings view because it is materialized.
			await Reading.refreshDailyReadings(conn);

			const barReadings = await Reading.getMeterBarReadings([meter.id], graphicUnitId, timestamp1, timestamp5, 1, conn);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);

			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 100 * conversionSlope, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() },
				{ reading: 200 * conversionSlope, start_timestamp: timestamp2.valueOf(), end_timestamp: timestamp3.valueOf() },
				{ reading: 300 * conversionSlope, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp4.valueOf() },
				{ reading: 400 * conversionSlope, start_timestamp: timestamp4.valueOf(), end_timestamp: timestamp5.valueOf() }
			]);
		});

		mocha.it('Retrieves the correct interval for a single meter and multiple days width', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter.id, 200, timestamp2, timestamp3),
				new Reading(meter.id, 300, timestamp3, timestamp4),
				new Reading(meter.id, 400, timestamp4, timestamp5)
			], conn);
			// We need to refresh the daily readings view because it is materialized.
			await Reading.refreshDailyReadings(conn);

			const barReadings = await Reading.getMeterBarReadings([meter.id], graphicUnitId, timestamp1, timestamp5, 2, conn);
			expect(barReadings).to.have.keys([meter.id.toString()]);
			const readingsForMeter = barReadings[meter.id];
			const readingsForMeterComparable = readingsForMeter.map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 300 * conversionSlope, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp3.valueOf() },
				{ reading: 700 * conversionSlope, start_timestamp: timestamp3.valueOf(), end_timestamp: timestamp5.valueOf() }
			]);
		});

		mocha.it('Retrieves the correct barchart readings for multiple meters for one day', async () => {
			await Reading.insertAll([
				new Reading(meter.id, 100, timestamp1, timestamp2),
				new Reading(meter2.id, 1, timestamp1, timestamp2)
			], conn);
			// We need to refresh the daily readings view because it is materialized.
			await Reading.refreshDailyReadings(conn);
			const barReadings = await Reading.getMeterBarReadings([meter.id, meter2.id], graphicUnitId, timestamp1, timestamp2, 1, conn);
			expect(barReadings).to.have.keys([meter.id.toString(), meter2.id.toString()]);
			const readingsForMeterComparable = barReadings[meter.id].map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			const readingsForMeter2Comparable = barReadings[meter2.id].map(
				({ reading, start_timestamp, end_timestamp }) => ({ reading, start_timestamp: start_timestamp.valueOf(), end_timestamp: end_timestamp.valueOf() })
			);
			expect(readingsForMeterComparable).to.deep.equal([
				{ reading: 100 * conversionSlope, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() }
			]);
			expect(readingsForMeter2Comparable).to.deep.equal([
				{ reading: 1 * conversionSlope, start_timestamp: timestamp1.valueOf(), end_timestamp: timestamp2.valueOf() }
			]);
		});

		// TODO groups too
	});
});
