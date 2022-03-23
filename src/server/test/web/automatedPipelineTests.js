/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
    
 const { chai, mocha, expect, app, testDB, testUser } = require('../common');
 const Meter = require('../../models/Meter');
 const Reading = require('../../models/Reading');
 const zlib = require('zlib');
 
 const fs = require('fs');
 const csv = require('csv');
 const promisify = require('es6-promisify');
 
 const parseCsv = promisify(csv.parse);
 
 const UPLOAD_METERS_ROUTE = '/api/csv/meters';
 const UPLOAD_READINGS_ROUTE = '/api/csv/readings';
 
 // File buffers for testing
 const readingsPath = `${__dirname}/csvPipeline/sampleReadings.csv`;
 const readingsBuffer = fs.readFileSync(readingsPath);
 const zippedReadingsBuffer = zlib.gzipSync(readingsBuffer);
 const metersPath = `${__dirname}/csvPipeline/sampleMeters.csv`;
 const metersBuffer = fs.readFileSync(metersPath);
 const zippedMetersBuffer = zlib.gzipSync(metersBuffer);
 const metersPathWithHeader = `${__dirname}/csvPipeline/sampleMetersWithHeader.csv`;
 const metersWithHeaderBuffer = fs.readFileSync(metersPathWithHeader);
 const zippedMetersWithHeaderBuffer = zlib.gzipSync(metersWithHeaderBuffer);
 
 mocha.describe('csv API', () => {
     mocha.describe('not-zipped data', () => {
         mocha.it('should be able to accept a post request to upload unzipped meter data.', async () => {
             const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .field('gzip', 'false')
                 .attach('csvfile', metersBuffer, `${readingsPath}`)
 
             expect(res).to.have.status(200);
             const csvMeters = (await parseCsv(metersBuffer)).map(row =>
                 (new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
             );
 
             const conn = testDB.getConnection();
             const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
                 const dbMeter = await Meter.getByName(meter.name, conn);
                 csvMeters[idx].id = dbMeter.id;
                 return meter;
             }));
             expect(dbMeters.length).to.equal(csvMeters.length);
             expect(dbMeters).to.deep.equal(csvMeters);
             expect((await Meter.getAll(conn)).length).to.equal(3);
         });
         mocha.it('should be able to accept a post request to upload unzipped meter data with header row.', async () => {
             const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .field('headerRow', 'true')
                 .field('gzip', 'false')
                 .attach('csvfile', metersWithHeaderBuffer, `${metersPathWithHeader}`)
 
             expect(res).to.have.status(200);
             const csvMeters = (await parseCsv(metersWithHeaderBuffer)).map(row =>
                 (new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
             ).slice(1);
 
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
                 .attach('csvfile', readingsBuffer, `${readingsPath}`)
 
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
                 .attach('csvfile', readingsBuffer, `${readingsPath}`)
 
             const meter = await Meter.getByName('ABG', conn);
             const readings = await Reading.getAllByMeterID(meter.id, conn);
             const extractedReadings = readings.map(reading => {
                 return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
             });
             const fileReadings = await parseCsv(readingsBuffer);
             expect(extractedReadings).to.deep.equals(fileReadings);
         });
     });
     mocha.describe('zipped data', () => {
         mocha.it('should be able to accept a post request to upload zipped meter data.', async () => {
             const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .attach('csvfile', zippedMetersBuffer, `${readingsPath}.gz`)
 
             expect(res).to.have.status(200);
             const csvMeters = (await parseCsv(metersBuffer)).map(row =>
                 (new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
             );
 
             const conn = testDB.getConnection();
             const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
                 const dbMeter = await Meter.getByName(meter.name, conn);
                 csvMeters[idx].id = dbMeter.id;
                 return meter;
             }));
             expect(dbMeters.length).to.equal(csvMeters.length);
             expect(dbMeters).to.deep.equal(csvMeters);
             expect((await Meter.getAll(conn)).length).to.equal(3);
         });
         mocha.it('should be able to accept a post request to upload zipped  meter data with header row.', async () => {
             const res = await chai.request(app).post(UPLOAD_METERS_ROUTE)
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .field('headerRow', 'true')
                 .attach('csvfile', zippedMetersWithHeaderBuffer, `${metersPathWithHeader}.gz`)
             expect(res).to.have.status(200);
             const csvMeters = (await parseCsv(metersWithHeaderBuffer)).map(row =>
                 (new Meter(undefined, row[0], row[1], row[2] === 'TRUE', row[3] === 'TRUE', row[4], row[5]))
             ).slice(1);
 
             const conn = testDB.getConnection();
             const dbMeters = await Promise.all(csvMeters.map(async (meter, idx) => {
                 const dbMeter = await Meter.getByName(meter.name, conn);
                 csvMeters[idx].id = dbMeter.id;
                 return meter;
             }));
             expect(dbMeters).to.deep.equal(csvMeters);
             expect((await Meter.getAll(conn)).length).to.equal(3);
         });
         mocha.it('should be able to load zipped readings data for an existing meter.', async () => {
             const conn = testDB.getConnection();
             const meter = new Meter(undefined, 'XXX', undefined, false, false, Meter.type.MAMAC, 'XXX')
             await meter.insert(conn); // insert meter
             const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .field('meterName', 'XXX')
                 .field('timeSort', 'increasing')
                 .attach('csvfile', zippedReadingsBuffer, `${readingsPath}.gz`)
 
             expect(res).to.have.status(200);
             const readings = await Reading.getAllByMeterID(meter.id, conn);
             const extractedReadings = readings.map(reading => {
                 return [`${reading.reading}`, reading.startTimestamp._i, reading.endTimestamp._i];
             });
             const fileReadings = await parseCsv(readingsBuffer);
             expect(extractedReadings).to.deep.equals(fileReadings);
         });
         mocha.it('should be able to load zipped readings data for a non existing meter.', async () => {
             const conn = testDB.getConnection();
             const res = await chai.request(app).post(UPLOAD_READINGS_ROUTE) // make request to api to upload readings data for this meter
                 .field('email', testUser.email)
                 .field('password', testUser.password)
                 .field('createMeter', 'true')
                 .field('meterName', 'ABG')
                 .field('timeSort', 'increasing')
                 .attach('csvfile', zippedReadingsBuffer, `${readingsPath}.gz`)
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