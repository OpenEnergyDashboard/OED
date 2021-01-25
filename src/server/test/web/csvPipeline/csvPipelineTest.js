const { chai, mocha, expect, app, testDB, testUser } = require('../../common');
const Meter = require('../../../models/Meter');
const Reading = require('../../../models/Reading');
const zlib = require('zlib');

const fs = require('fs');
const csv = require('csv');
const promisify = require('es6-promisify');

const parseCsv = promisify(csv.parse);

const CSV_ROUTE = '/api/csv';
const UPLOAD_METERS_ROUTE = '/api/csv/meters';
const UPLOAD_READINGS_ROUTE = '/api/csv/readings';
const readingsPath = './sampleReadings.csv.gz';
const metersPath = './sampleMeters.csv.gz';
const metersWithHeaderPath = './sampleMetersWithHeader.csv.gz';

mocha.describe('csv API', () => {
	mocha.it('should be able to accept a post request to upload meter data.', async () => {
		const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
			.field('password', 'password')
			.attach('csvfile', metersPath)
		expect(res).to.have.status(200);
		const csvMeters = (await parseCsv(zlib.gunzipSync(fs.readFileSync(metersPath)))).map(row =>
			(new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
		);

		const conn = testDB.getConnection();
		const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
			const meter_1 = await Meter.getByName(meter.name, conn);
			csvMeters[idx].id = meter_1.id;
			return meter_1;
		}));
		expect(dbMeters).to.deep.equal(csvMeters);
		expect((await Meter.getAll(conn)).length).to.equal(3);
	});
	mocha.it('should be able to accept a post request to upload meter data with header row.', async () => {
		const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
			.field('password', 'password')
			.field('headerrow', 'true')
			.attach('csvfile', metersWithHeaderPath)
		expect(res).to.have.status(200);
		const csvMeters = (await parseCsv(zlib.gunzipSync(fs.readFileSync(metersWithHeaderPath)))).map(row =>
			(new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
		).slice(1);

		const conn = testDB.getConnection();
		const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
			const meter_1 = await Meter.getByName(meter.name, conn);
			csvMeters[idx].id = meter_1.id;
			return meter_1;
		}));
		expect(dbMeters).to.deep.equal(csvMeters);
		expect((await Meter.getAll(conn)).length).to.equal(3);
	});
	mocha.it('should be able to load readings data for an existing meter.', async () => {
		const conn = testDB.getConnection();
		const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
		await meter.insert(conn); // insert meter
		const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
			.field('password', 'password')
			.field('meter', 'XXX')
			.field('timesort', 'increasing')
			.attach('csvfile', readingsPath)
		const readings = await Reading.getAllByMeterID(meter.id, conn);
		const extractedReadings = readings.map(reading => {
			return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
		});
		const fileReadings = await parseCsv(zlib.gunzipSync(fs.readFileSync(readingsPath)));
		expect(extractedReadings).to.deep.equals(fileReadings);
	});
	mocha.it('should be able to load readings data for a non existing meter.', async () => {
		const conn = testDB.getConnection();
		const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
			.field('password', 'password')
			.field('createmeter', 'true')
			.field('meter', 'ABG')
			.field('timesort', 'increasing')
			.attach('csvfile', readingsPath);
		const meter = await Meter.getByName('ABG', conn);
		const readings = await Reading.getAllByMeterID(meter.id, conn);
		const extractedReadings = readings.map(reading => {
			return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
		});
		const fileReadings = await parseCsv(zlib.gunzipSync(fs.readFileSync(readingsPath)));
		expect(extractedReadings).to.deep.equals(fileReadings);
	});
	mocha.describe('should fail on unimplemented features.', async () => {
		mocha.it('should fail on non-increasing timesort.', async () => {
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('password', 'password')
				.field('meter', 'ABG')
				.field('timesort', 'decreasing')
				.attach('csvfile', readingsPath);
			expect(res).to.have.status(400);
			console.log(res.text);
		});
		mocha.it('should fail on request that updates data.', async () => {
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('password', 'password')
				.field('meter', 'ABG')
				.field('update', 'true')
				.attach('csvfile', readingsPath);
			expect(res).to.have.status(400);
			console.log(res.text);
		});
		mocha.it('should fail on request that asks to disable create meter automatically.', async () => {
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('password', 'password')
				.field('meter', 'ABG')
				.field('createmeter', 'false')
				.attach('csvfile', readingsPath);
			expect(res).to.have.status(400);
			console.log(res.text);
		});
		mocha.it('should fail on request that asks to invalid duplications.', async () => {
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('password', 'password')
				.field('meter', 'ABG')
				.field('duplications', 'INVALIDVALUE')
				.attach('csvfile', readingsPath);
			expect(res).to.have.status(400);
			console.log(res.text);
		});
		mocha.it('should fail on request that asks to invalid cumulative value.', async () => {
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('password', 'password')
				.field('meter', 'ABG')
				.field('cumulative', 'INVALIDVALUE')
				.attach('csvfile', readingsPath);
			expect(res).to.have.status(400);
			console.log(res.text);
		});
	});
});