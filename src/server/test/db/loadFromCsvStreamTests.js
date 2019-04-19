/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const path = require('path');
const streamBuffers = require('stream-buffers');
const fs = require('fs');
const promisify = require('es6-promisify');

const { mocha, expect, testDB } = require('../common');
const Reading = require('../../models/Reading');
const Meter = require('../../models/Meter');
const loadFromCsvStream = require('../../services/loadFromCsvStream');

mocha.describe('Read Mamac log from a file: ', () => {
	let meter;
	mocha.beforeEach(async () => {
		// TODO: This should be refactored into a method as it appears in at least
		// four test suites verbiatim
		const conn = testDB.getConnection();
		await new Meter(undefined, 'Meter', null, false, true, Meter.type.MAMAC).insert(conn);
		meter = await Meter.getByName('Meter', conn);
	});

	mocha.it('loads the correct number of rows from a file', async () => {
		const conn = testDB.getConnection();
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
		await loadFromCsvStream(
			myReadableStreamBuffer,
			row => {
				const readRate = parseInt(row[0]);
				const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
				const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
				return new Reading(meter.id, readRate, startTimestamp, endTimestamp);
			},
			(readings, tx) => Reading.insertOrIgnoreAll(readings, tx),
			conn
		);
		const count = await Reading.count(conn);
		expect(count).to.equal(20);
	});

	mocha.it('errors correctly on an invalid file', async () => {
		const conn = testDB.getConnection();
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
			}, (readings, tx) => Reading.insertOrIgnoreAll(readings, tx),
			conn
			)).to.eventually.be.rejected;
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
			}, (readings, tx) => Reading.insertOrIgnoreAll(readings, tx),
			conn
			);
		} catch (e) {
			const count = await Reading.count(conn);
			expect(count).to.equal(0);
		}
	});
});
