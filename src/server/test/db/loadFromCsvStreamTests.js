/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');
const path = require('path');
const Reading = require('../../models/Reading');
const streamBuffers = require('stream-buffers');
const fs = require('fs');
const promisify = require('es6-promisify');

chai.use(chaiAsPromised);
const expect = chai.expect;
const recreateDB = require('./common').recreateDB;
const db = require('../../models/database').db;
const Meter = require('../../models/Meter');
const loadFromCsvStream = require('../../services/loadFromCsvStream');

const mocha = require('mocha');

mocha.describe('Read mamc log from a file: ', () => {
	mocha.beforeEach(recreateDB);
	let meter;
	mocha.beforeEach(async () => {
		await new Meter(undefined, 'Meter', null, false, Meter.type.MAMAC).insert();
		meter = await Meter.getByName('Meter');
	});

	mocha.it('loads the correct number of rows from a file', async () => {
		const testFilePath = path.join(__dirname, 'data', 'mamac-log.csv');
		const readFile = promisify(fs.readFile);
		const buffer = await readFile(testFilePath);
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		// open file.
		myReadableStreamBuffer.put(buffer);
		myReadableStreamBuffer.stop();
		await loadFromCsvStream(myReadableStreamBuffer, row => {
			const readRate = parseInt(row[0]);
			const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
			const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
			return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
		}, (readings, tx) => Reading.insertOrUpdateAll(readings, tx));
		const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
		expect(parseInt(count)).to.equal(20);
	});

	mocha.it('errors correctly on an invalid file', async () => {
		const testFilePath = path.join(__dirname, 'data', 'mamac-invalid.csv');
		const readFile = promisify(fs.readFile);
		const buffer = await readFile(testFilePath);
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		myReadableStreamBuffer.put(buffer);
		myReadableStreamBuffer.stop();
		return expect(
			loadFromCsvStream(myReadableStreamBuffer, row => {
				const readRate = parseInt(row[0]);
				const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
				const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
				return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
			}, (readings, tx) => Reading.insertOrUpdateAll(readings, tx))
		).to.eventually.be.rejected;
	});

	mocha.it('rolls back correctly when it rejects', async () => {
		const testFilePath = path.join(__dirname, 'data', 'mamac-invalid.csv');
		const readFile = promisify(fs.readFile);
		const buffer = await readFile(testFilePath);
		const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
			frequency: 10,
			chunkSize: 2048
		});
		myReadableStreamBuffer.put(buffer);
		myReadableStreamBuffer.stop();
		try {
			await loadFromCsvStream(myReadableStreamBuffer, row => {
				const readRate = parseInt(row[0]);
				const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
				const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
				return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
			}, (readings, tx) => Reading.insertOrUpdateAll(readings, tx));
		} catch (e) {
			const { count } = await db.one('SELECT COUNT(*) as count FROM readings');
			expect(parseInt(count)).to.equal(0);
		}
	});
});
