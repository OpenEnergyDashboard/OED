const { chai, mocha, expect, app, testDB, testUser } = require('../../common');
const Meter = require('../../../models/Meter');
const readCSV = require('../../../services/pipeline-in-progress/readCsv');
const Reading = require('../../../models/Reading');

const CSV_ROUTE = '/api/csv';

mocha.describe('csv API', () => {
	mocha.it('should exist on the route "/api/csv" ', async () => {
		const res = await chai.request(app).get(CSV_ROUTE);
		expect(res).to.have.status(200);
	});
	mocha.it('should be able to accept a post request to upload meter data.', async () => {
		const res = await chai.request(app).post(CSV_ROUTE)
			.field('mode', 'meter')
			.field('timesort', 'increasing')
			.attach('csvfile', './sampleMeters.csv')
		expect(res).to.have.status(400); // Uploading meters is not implemented
	});
	mocha.it('should be able to load readings data for an existing meter.', async () => {
		const conn = testDB.getConnection();
		const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
		await meter.insert(conn); // insert meter
		const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
			.field('mode', 'readings')
			.field('meter', 'XXX')
			.field('timesort', 'increasing')
			.attach('csvfile', './sampleReadings.csv')
		const readings = await Reading.getAllByMeterID(meter.id, conn);
		const extractedReadings = readings.map(reading => {
			return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
		});
		const fileReadings = await readCSV('./sampleReadings.csv');
		expect(extractedReadings).to.deep.equals(fileReadings);
	});
	mocha.it('should be able to load readings data for a non existing meter.', async () => {
		const conn = testDB.getConnection();
		const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
			.field('mode', 'readings')
			.field('meter', 'ABG')
			.field('timesort', 'increasing')
			.attach('csvfile', './sampleReadings.csv');
		const meter = await Meter.getByName('ABG', conn);
		const readings = await Reading.getAllByMeterID(meter.id, conn);
		const extractedReadings = readings.map(reading => {
			return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
		});
		const fileReadings = await readCSV('./sampleReadings.csv');
		expect(extractedReadings).to.deep.equals(fileReadings);
	});
	mocha.describe('should fail on unimplemented features.', async () => {
		mocha.it('should fail on non-increasing timesort.', async () => {
			const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
				.field('mode', 'readings')
				.field('meter', 'ABG')
				.field('timesort', 'decreasing')
				.attach('csvfile', './sampleReadings.csv');
			expect(res).to.have.status(400);
		});
		mocha.it('should fail on request that updates data.', async () => {
			const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
				.field('mode', 'readings')
				.field('meter', 'ABG')
				.field('update', 'true')
				.attach('csvfile', './sampleReadings.csv');
			expect(res).to.have.status(400);
		});
		mocha.it('should fail on request that asks to disable create meter automatically.', async () => {
			const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
				.field('mode', 'readings')
				.field('meter', 'ABG')
				.field('createmeter', 'false')
				.attach('csvfile', './sampleReadings.csv');
			expect(res).to.have.status(400);
		});
		mocha.it('should fail on request that asks to invalid duplications.', async () => {
			const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
				.field('mode', 'readings')
				.field('meter', 'ABG')
				.field('duplications', 'INVALIDVALUE')
				.attach('csvfile', './sampleReadings.csv');
			expect(res).to.have.status(400);
		});
		mocha.it('should fail on request that asks to invalid cumulative value.', async () => {
			const res = await chai.request(app).post(CSV_ROUTE) // make request to api to upload readings data for this meter
				.field('mode', 'readings')
				.field('meter', 'ABG')
				.field('cumulative', 'INVALIDVALUE')
				.attach('csvfile', './sampleReadings.csv');
			expect(res).to.have.status(400);
		});
	});
});