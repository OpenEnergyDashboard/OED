const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const Meter = require('../../models/Meter');
const Reading = require('../../models/Reading');
const zlib = require('zlib');
​
const fs = require('fs');
const csv = require('csv');
const promisify = require('es6-promisify');
​
const parseCsv = promisify(csv.parse);
​
const UPLOAD_METERS_ROUTE = '/api/csv/meters';
const UPLOAD_READINGS_ROUTE = '/api/csv/readings';
​
​
const cumAsc = `${__dirname}/csvPipline/cumAsc.csv`;
const readingsBuff = fs.readFileSync(readingPath);
const ZippedReadingBuff = zlib.gzipSync(readingBuff);
const metersBuffer = fs.readFileSync(metersPath);
const metersWithHeaderBuffer = fs.readFileSync(metersPathWithHeader);
const metersWithHeader = `${__dirname}/csvPipeline/sampleMetersWithHeader.csv`;
const cumAscAdd1 = `${__dirname}/csvPipline/cumAscAdd1.csv`;
​
​
mocha.describe('csv API', () => {

	//cumAsc.csv
	mocha.describe('csv API', () => {
		mocha.describe('not-zipped data', () => {
			mocha.it('should be able to accept a post request to upload unzipped meter data.', async () => {
				const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
					.field('email', testUser.email)
					.field('password', testUser.password)
					.field('gzip', 'false')
					.attach('csvfile', metersBuffer, `${cumAsc}`)
​
				expect(res).to.have.status(200);
				const csvMeters = (await parseCsv(metersBuffer)).map(row =>
					(new Meter(undefined, row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
				);
​
				const con = testDB.getConnection();
				const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
					const dbMeter = await Meter.getByName(meter.name, con);
					csvMeters[idx].id = dbMeter.id;
					return meter;
				}));
				expect(dbMeters.length).to.equal(csvMeters.length);
				expect(dbMeters).to.deep.equal(csvMeters);
				expect((await Meter.getAll(con)).length).to.equal(3);
			});
			mocha.it('should be able to accept a post request to upload unzipped meter data with header row.', async () => {
			const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('headerRow', 'true')
				.field('gzip', 'false')
				.attach('csvfile', metersWithHeaderBuffer, `${metersPathWithHeader}`)
​
			expect(res).to.have.status(200);
			const csvMeters = (await parseCsv(metersWithHeaderBuffer)).map(row =>
				(new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
			).slice(1);
​
			const conn = testDB.getConnection();
			const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
				const dbMeter = await Meter.getByName(meter.name, conn);
				csvMeters[idx].id = dbMeter.id;
				return meter;
			}));
			expect(dbMeters).to.deep.equal(csvMeters);
			expect((await Meter.getAll(conn)).length).to.equal(3);
		});
		mocha.it('should be able to load unzipped readings data for an existing meter.', async () => {
			const conn = testDB.getConnection();
			const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
			await meter.insert(conn); // insert meter
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('meterName', 'XXX')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuff, `${cumAsc}`)
​
			expect(res).to.have.status(200);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
		mocha.it('should be able to load unzipped readings data for a non existing meter.', async () => {
			const conn = testDB.getConnection();
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('createMeter', 'true')
				.field('meterName', 'ABG')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuffer, `${cumAsc}`)
​
			const meter = await Meter.getByName('ABG', conn);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
	});
​
	//metersWithHeader.csv
	mocha.describe('csv API', () => {
		mocha.describe('not-zipped data', () => {
			mocha.it('should be able to accept a post request to upload unzipped meter data.', async () => {
				const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
					.field('email', testUser.email)
					.field('password', testUser.password)
					.field('gzip', 'false')
					.attach('csvfile', metersBuffer, `${metersWithHeader}`)
​
				expect(res).to.have.status(200);
				const csvMeters = (await parseCsv(metersBuffer)).map(row =>
					(new Meter(undefined, row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
				);
​
				const con = testDB.getConnection();
				const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
					const dbMeter = await Meter.getByName(meter.name, con);
					csvMeters[idx].id = dbMeter.id;
					return meter;
				}));
				expect(dbMeters.length).to.equal(csvMeters.length);
				expect(dbMeters).to.deep.equal(csvMeters);
				expect((await Meter.getAll(con)).length).to.equal(3);
			});
			mocha.it('should be able to accept a post request to upload unzipped meter data with header row.', async () => {
			const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('headerRow', 'true')
				.field('gzip', 'false')
				.attach('csvfile', metersWithHeaderBuffer, `${metersPathWithHeader}`)
​
			expect(res).to.have.status(200);
			const csvMeters = (await parseCsv(metersWithHeaderBuffer)).map(row =>
				(new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
			).slice(1);
​
			const conn = testDB.getConnection();
			const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
				const dbMeter = await Meter.getByName(meter.name, conn);
				csvMeters[idx].id = dbMeter.id;
				return meter;
			}));
			expect(dbMeters).to.deep.equal(csvMeters);
			expect((await Meter.getAll(conn)).length).to.equal(3);
		});
		mocha.it('should be able to load unzipped readings data for an existing meter.', async () => {
			const conn = testDB.getConnection();
			const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
			await meter.insert(conn); // insert meter
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('meterName', 'XXX')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuff, `${metersWithHeader}`)
​
			expect(res).to.have.status(200);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
		mocha.it('should be able to load unzipped readings data for a non existing meter.', async () => {
			const conn = testDB.getConnection();
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('createMeter', 'true')
				.field('meterName', 'ABG')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuffer, `${metersWithHeader}`)
​
			const meter = await Meter.getByName('ABG', conn);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
	});
	
    //cumAscAdd1.csv
	mocha.describe('csv API', () => {
		mocha.describe('not-zipped data', () => {
			mocha.it('should be able to accept a post request to upload unzipped meter data.', async () => {
				const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
					.field('email', testUser.email)
					.field('password', testUser.password)
					.field('gzip', 'false')
					.attach('csvfile', metersBuffer, `${cumAscAdd1}`)
​
				expect(res).to.have.status(200);
				const csvMeters = (await parseCsv(metersBuffer)).map(row =>
					(new Meter(undefined, row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
				);
​
				const con = testDB.getConnection();
				const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
					const dbMeter = await Meter.getByName(meter.name, con);
					csvMeters[idx].id = dbMeter.id;
					return meter;
				}));
				expect(dbMeters.length).to.equal(csvMeters.length);
				expect(dbMeters).to.deep.equal(csvMeters);
				expect((await Meter.getAll(con)).length).to.equal(3);
			});
			mocha.it('should be able to accept a post request to upload unzipped meter data with header row.', async () => {
			const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('headerRow', 'true')
				.field('gzip', 'false')
				.attach('csvfile', metersWithHeaderBuffer, `${metersPathWithHeader}`)
​
			expect(res).to.have.status(200);
			const csvMeters = (await parseCsv(metersWithHeaderBuffer)).map(row =>
				(new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
			).slice(1);
​
			const conn = testDB.getConnection();
			const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
				const dbMeter = await Meter.getByName(meter.name, conn);
				csvMeters[idx].id = dbMeter.id;
				return meter;
			}));
			expect(dbMeters).to.deep.equal(csvMeters);
			expect((await Meter.getAll(conn)).length).to.equal(3);
		});
		mocha.it('should be able to load unzipped readings data for an existing meter.', async () => {
			const conn = testDB.getConnection();
			const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
			await meter.insert(conn); // insert meter
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('meterName', 'XXX')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuff, `${cumAscAdd1}`)
​
			expect(res).to.have.status(200);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
		mocha.it('should be able to load unzipped readings data for a non existing meter.', async () => {
			const conn = testDB.getConnection();
			const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
				.field('email', testUser.email)
				.field('password', testUser.password)
				.field('createMeter', 'true')
				.field('meterName', 'ABG')
				.field('timeSort', 'increasing')
				.field('gzip', 'false')
				.attach('csvfile', readingsBuffer, `${cumAscAdd1}`)
​
			const meter = await Meter.getByName('ABG', conn);
			const readings = await Reading.getAllByMeterID(meter.id, conn);
			const extractedReadings = readings.map(reading => {
				return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
			});
			const fileReadings = await parseCsv(readingsBuffer);
			expect(extractedReadings).to.deep.equals(fileReadings);
		});
	});
});