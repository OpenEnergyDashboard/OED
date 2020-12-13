/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * imports. we use the testing tdd testing framework mocha and the assertion
 * library chai.
 */

const _ = require('lodash');
const chai = require('chai');
const mocha = require('mocha');
const expect = chai.expect;
const fs = require('fs').promises;
const moment = require('moment');
const promisify = require('es6-promisify');
const csv = require('csv');
const parseCsv = promisify(csv.parse);

const generateData = require('../data/generateTestingData'); // To get this file compile ../data/generateTestingData.ts

mocha.describe('The generateDates function', () => {
	const generateDates = generateData.generateDates;
	mocha.it('should exist.', () => {
		expect(typeof (generateDates)).to.equal('function');
	});
	mocha.it('should be able to generate dates at different time steps.', () => {
		const startTimeStamp = '2020-10-01 21:00:00';
		const endTimeStamp = '2020-10-02 21:00:00';
		const timeStep = { days: 1 };
		expect(generateDates(startTimeStamp, endTimeStamp, timeStep)).to.deep.equal(
			[startTimeStamp, endTimeStamp]
		);
	});
	mocha.it('should be able to generate dates at a time step 15 seconds', () => {
		const startTimeStamp = '2020-10-01 21:00:00';
		const endTimeStamp = '2020-10-02 21:00:00';
		const timeStep = { second: 15 };
		const startMoment = moment(startTimeStamp);
		const endMoment = moment(endTimeStamp);
		const result = [];
		while (!startMoment.isAfter(endMoment)) {
			result.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
			startMoment.add(timeStep);
		}
		expect(generateDates(startTimeStamp, endTimeStamp, timeStep)).to.deep.equal(
			result
		);
	});
});

mocha.describe('momenting', () => {
	const momenting = generateData.momenting;
	mocha.it('should cover the simple singleton case', () => {
		const date = '2019-09-10 00:00:15';
		const periodOfMoments = [moment(date)];
		expect([1]).to.deep.equals(momenting(periodOfMoments));
	});
	mocha.it('should be able to partition an array with just two elements', () => {
		const startMoment = moment('2019-09-10 00:00:15');
		const timeStepMs = 15000;
		expect([0, 1]).to.deep.equals(momenting([startMoment, startMoment.clone().add(timeStepMs)], timeStepMs));
	});
	mocha.it('should cover the a skipped datetime', () => {
		const test = ['2019-09-10T00:00:15',
			'2019-09-10T00:00:30', '2019-09-10T00:01:00'];
		const timeStepMs = 15000;
		expect(momenting(test.map(timeStamp => moment(timeStamp)), timeStepMs)).to.deep.equals([0, 1, 1]);
	});
	mocha.it('should work on irregular timesteps', () => {
		const test = ['2019-09-10T00:00:15',
			'2019-09-10T00:00:30', '2019-09-10T00:00:50'];
		const timeStepMs = 15000;
		expect(momenting(test.map(timeStamp => moment(timeStamp)), timeStepMs)).to.deep.equals([0, 1, 5 / 15]);
	});
});

mocha.describe('Generate sinewave helper', () => {
	const _generateSineData = generateData._generateSineData;
	mocha.it('should exist', () => {
		expect(typeof (_generateSineData)).to.equal('function');
	});
	mocha.it('should be able to generate data for simply one day', () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		expect(_generateSineData(startTimeStamp, endTimeStamp, { timeStep: { day: 1 } })).to.deep.equals([[startTimeStamp, '1'], [endTimeStamp, '1']]);
	});
	mocha.it('should be able to generate data for half a day', () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		expect(_generateSineData(startTimeStamp, endTimeStamp, { timeStep: { hour: 12 } }))
		.to.deep.equals([[startTimeStamp, '1'], ['2019-09-10 12:00:00', '1'], [endTimeStamp, '1']]);
	});
});

mocha.describe('Generate Sinewave', () => {
	const _generateSineData = generateData._generateSineData;
	const generateSine = generateData.generateSine;
	mocha.it('should properly write to file', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const filename = 'test1.csv';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 } };
		const maxAmplitude = 2;
		const data = _generateSineData(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude });
		await generateSine(startTimeStamp, endTimeStamp, { ...timeOptions, filename: `${__dirname}/${filename}`, maxAmplitude: maxAmplitude });
		// https://stackabuse.com/reading-and-writing-csv-files-in-nodejs-with-node-csv/
		const dataFromFile = await fs.readFile(`${__dirname}/${filename}`);
		const records = await parseCsv(dataFromFile);

		expect(records).to.deep.equal(data);
		await fs.unlink(`${__dirname}/${filename}`); // delete test file created
	});
	mocha.it('should be able to normalize values for OED', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const filename = 'test2.csv';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 }, normalizeByHour: true};
		const maxAmplitude = 2;
		const data = _generateSineData(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude })
			.map(row => {
				let scaledValue = row[1] * 1/3;
				scaledValue = scaledValue.toFixed(8); // we reduce numbers down to 8 decimals places because the rest are insignificant
				return [row[0], scaledValue];
			} );
		await generateSine(startTimeStamp, endTimeStamp, { ...timeOptions, filename: `${__dirname}/${filename}`, maxAmplitude: maxAmplitude });
		// https://stackabuse.com/reading-and-writing-csv-files-in-nodejs-with-node-csv/
		const dataFromFile = await fs.readFile(`${__dirname}/${filename}`);
		const preprocessedRecords = await parseCsv(dataFromFile);
		// we reduce numbers down to 8 decimals places because there will be differences at very
		// low significant places.
		const records = preprocessedRecords.map(row => [row[0], parseFloat(row[1]).toFixed(8)]);
		expect(records).to.deep.equal(data);
		await fs.unlink(`${__dirname}/${filename}`); // delete test file created
	});
});

mocha.describe('Generate Cosine wave', () => {
	const _generateSineData = generateData._generateSineData;
	const generateCosine = generateData.generateCosine;
	mocha.it('should properly write to file', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const filename = 'test1.csv';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 } };
		const maxAmplitude = 2;
		const data = _generateSineData(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude, phaseShift: (Math.PI / 2)});
		await generateCosine(startTimeStamp, endTimeStamp, { ...timeOptions, filename: `${__dirname}/${filename}`, maxAmplitude: maxAmplitude });
		// https://stackabuse.com/reading-and-writing-csv-files-in-nodejs-with-node-csv/
		const dataFromFile = await fs.readFile(`${__dirname}/${filename}`);
		const records = await parseCsv(dataFromFile);

		expect(records).to.deep.equal(data);
		await fs.unlink(`${__dirname}/${filename}`); // delete test file created
	});
});
