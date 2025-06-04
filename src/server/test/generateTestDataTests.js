/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * imports. we use the testing tdd testing framework mocha and the assertion
 * library chai.
 */

const util = require('util');
const chai = require('chai');
const mocha = require('mocha');
const expect = chai.expect;
const fs = require('fs').promises;
const moment = require('moment');
const csv = require('csv');
const parseCsv = util.promisify(csv.parse);
const path = require('path');

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
	mocha.it('should be able to generate dates at a time step 13 seconds', () => {
		const startTimeStamp = '2020-10-01 21:00:00';
		const endTimeStamp = '2020-10-02 21:00:00';
		const timeStep = { second: 13 };
		const startMoment = moment(startTimeStamp);
		const endMoment = moment(endTimeStamp);
		const result = [];
		while (!startMoment.isAfter(endMoment)) {
			result.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
			startMoment.add(timeStep);
		}
		const dates = generateDates(startTimeStamp, endTimeStamp, timeStep);
		expect(dates).to.deep.equal(result);
		expect(dates[dates.length - 1]).to.not.equal(endTimeStamp);
	});
});

mocha.describe('momenting', () => {
	const momenting = generateData.momenting;
	mocha.it('should cover the simple singleton case', () => {
		const date = '2019-09-10 00:00:15';
		const periodOfMoments = [moment(date)];
		expect(momenting(periodOfMoments, undefined)).to.deep.equals([1]);
	});
	mocha.it('should be able to partition an array with just two elements', () => {
		const startMoment = moment('2019-09-10 00:00:15');
		const timeStepMs = 15000;
		expect(momenting([startMoment, startMoment.clone().add(timeStepMs)], timeStepMs)).to.deep.equals([0, 1]);
	});
	mocha.it('should cover the a skipped date time', () => {
		const test = ['2019-09-10T00:00:15',
			'2019-09-10T00:00:30', '2019-09-10T00:01:00'];
		const timeStepMs = 15000;
		expect(momenting(test.map(timeStamp => moment(timeStamp)), timeStepMs)).to.deep.equals([0, 1, 1]);
	});
	mocha.it('should work on irregular time steps', () => {
		const test = ['2019-09-10T00:00:15',
			'2019-09-10T00:00:30', '2019-09-10T00:00:50'];
		const timeStepMs = 15000;
		expect(momenting(test.map(timeStamp => moment(timeStamp)), timeStepMs)).to.deep.equals([0, 1, 5 / 15]);
	});
});

mocha.describe('Generate Sine wave helper', () => {
	const generateSineData = generateData.generateSineData;
	mocha.it('should exist', () => {
		expect(typeof (generateSineData)).to.equal('function');
	});
	mocha.it('should be able to generate data for simply one day', () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const lastEndTimeStamp = '2019-09-12 00:00:00';
		const expectation = [[1, startTimeStamp, endTimeStamp], [1, endTimeStamp, lastEndTimeStamp]];
		generateSineData(startTimeStamp, endTimeStamp, { timeStep: { day: 1 }, squared: false }).forEach((row, idx) => {
			expect(row.value).to.be.closeTo(expectation[idx][0], 0.0001);
			expect(row.startTimeStamp).to.equal(expectation[idx][1]);
			expect(row.endTimeStamp).to.equal(expectation[idx][2]);
		});
	});
	mocha.it('should be able to generate data for half a day', () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const midPointTimeStamp = '2019-09-10 12:00:00';
		const lastEndTimeStamp = '2019-09-11 12:00:00';
		const expectation = [[1, startTimeStamp, midPointTimeStamp], [1, midPointTimeStamp, endTimeStamp], [1, endTimeStamp, lastEndTimeStamp]];
		generateSineData(startTimeStamp, endTimeStamp, { timeStep: { hour: 12 }, squared: false }).forEach((row, idx) => {
			expect(row.value).to.be.closeTo(expectation[idx][0], 0.0001);
			expect(row.startTimeStamp).to.equal(expectation[idx][1]);
			expect(row.endTimeStamp).to.equal(expectation[idx][2]);
		});
	});
});

mocha.describe('Generate Sine wave', () => {
	const generateSineData = generateData.generateSineData;
	const generateSine = generateData.generateSine;
	mocha.it('should be able to normalize values for OED', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 }, normalize: true };
		const maxAmplitude = 2;
		const expectation = generateSineData(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude, squared: false })
			.map(row => {
				let scaledValue = row.value * 1 / 3;
				return { value: scaledValue, startTimeStamp: row.startTimeStamp, endTimeStamp: row.endTimeStamp };
			});
		generateSine(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude }).forEach((row, idx) => {
			expect(row.value).to.be.closeTo(expectation[idx].value, 0.0001);
			expect(row.startTimeStamp).to.equal(expectation[idx].startTimeStamp);
			expect(row.endTimeStamp).to.equal(expectation[idx].endTimeStamp);
		});
	});
	mocha.it('should be able to normalize and square values for OED', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 }, normalize: true };
		const maxAmplitude = 2;
		const expectation = generateSineData(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude })
			.map(row => {
				let scaledValue = (row.value * 1 / 3) ** 2;
				return { value: scaledValue, startTimeStamp: row.startTimeStamp, endTimeStamp: row.endTimeStamp };
			});
		generateSine(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude, squared: true }).forEach((row, idx) => {
			expect(row.value).to.be.closeTo(expectation[idx].value, 0.0001);
			expect(row.startTimeStamp).to.equal(expectation[idx].startTimeStamp);
			expect(row.endTimeStamp).to.equal(expectation[idx].endTimeStamp);
		});
	});
});

mocha.describe('Generate Cosine wave', () => {
	const generateSineData = generateData.generateSineData;
	const generateCosine = generateData.generateCosine;
	mocha.it('should be able to normalize and square values for OED', async () => {
		const startTimeStamp = '2019-09-10 00:00:00';
		const endTimeStamp = '2019-09-11 00:00:00';
		const timeOptions = { timeStep: { minute: 20 }, periodLength: { day: 1 }, normalize: true };
		const maxAmplitude = 2;
		const expectation = generateSineData(startTimeStamp, endTimeStamp,
			// Use shifted sine so actually cosine.
			{ ...timeOptions, maxAmplitude: maxAmplitude, phaseShift: (Math.PI / 2), squared: false })
			.map(row => {
				let scaledValue = (row.value * 1 / 3) ** 2;
				return { value: scaledValue, startTimeStamp: row.startTimeStamp, endTimeStamp: row.endTimeStamp };
			});
		(await generateCosine(startTimeStamp, endTimeStamp, { ...timeOptions, maxAmplitude: maxAmplitude, squared: true })).forEach((row, idx) => {
			expect(row.value).to.be.closeTo(expectation[idx].value, 0.0001);
			expect(row.startTimeStamp).to.equal(expectation[idx].startTimeStamp);
			expect(row.endTimeStamp).to.equal(expectation[idx].endTimeStamp);
		});
	});
});
