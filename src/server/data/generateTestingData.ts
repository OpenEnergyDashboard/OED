/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * generateTestData.js exports four functions:
 * generateDates,
 * generateSine,
 * write_to_csv,
 * generateSine
 */

// Imports
import { promises as fs } from 'fs';
import * as stringify from 'csv-stringify';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as promisify from 'es6-promisify';
import { log } from '../log';

const stringifyCSV = promisify(stringify);
/* Our main export is the generateSine function. We break this into several parts:
 * 1. Generate the moments in time within a specified range and at a specified time step from a given range.
 * 2. For each moment determine how much time as elapsed (as a decimal) within its respective period.
 * 3. Calculate the value of sine at that moment in time.
 * 		Conceptually this is sin(decimal_percentage * 2* PI) and it works because the sine function we will
 * 		use is a function of radians and sin(x) = sin(x/P * P * 2 * PI)
 * 4. We zip the array of moments and their corresponding sine values into a matrix,
 * which we will use write into a csv file.
 */

/**
 * Checks if a number is close to zero.
 * @param {number} x
 * @param {number} epsilon our default for what is close to zero is 1e-10
 * @returns {boolean} whether or not number is really close to zero
 * @source: https://www.quora.com/In-JavaScript-how-do-I-test-if-a-number-is-close-to-zero
 */
function isEpsilon(x: number, epsilon = 1e-10) {
	return Math.abs(x) < epsilon;
}

/**
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound
 * at endDate, which may or may not be included. Because of the date format,
 * the timeStep should also be at least 1 second.
 * @param {string} startDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {moment.MomentInputObject} timeStep Object with keys describe the time step, by default
 * this is { minute: 20 } or 20 minutes and needs to be at at least 1 second.
 * @returns {string[]} An array of timestamps between startDate and endDate, at a given time step
 * (default 20 minutes). The first element of the output will be the startDate, but the last element
 * may not necessarily be the endDate.
 */
function generateDates(startDate: string, endDate: string, timeStep: moment.MomentInputObject = { minute: 20 }): string[] {
	// Check timeStep is at least 1 second, if not throw an error.
	const temp = moment();
	if (temp.clone().add(timeStep).isBefore(temp.clone().add({ second: 1 }))) {
		throw Error(`The time step provided is ${JSON.stringify(timeStep)} needs to be at least 1 second.`);
	}
	const arrayOfMoments: string[] = [];
	const startMoment = moment(startDate);
	const endMoment = moment(endDate);
	while (startMoment.isSameOrBefore(endMoment)) {
		arrayOfMoments.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
		startMoment.add(timeStep);
	}
	return arrayOfMoments;
}

/**
 * Determine what percentage of elapsed time passed that is at what percentage
 * if the moment between startTime and endTime.
 * @param {moment.Moment} startTime should not be after the endTime: !startTime.isAfter(endTime) should return true
 * @param {moment.Moment} endTime should or be before startTime: !endTime.isBefore(startTime) should return true
 * @param {moment.Moment} currentMoment should be in between startTime and endTime
 * @returns {number} the percentage of elapsed time between startTime and endTime at currentMoment.
 * @source: https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
 */
function _momentPercentage(startTime: moment.Moment, endTime: moment.Moment, currentMoment: moment.Moment): number {
	// Check pre-conditions
	if (endTime.isBefore(startTime)) {
		throw RangeError('The endTime must be after or equal to the startTime.');
	}
	if (currentMoment.isBefore(startTime)) {
		throw RangeError('The currentMoment must be after or equal to the starTime.');
	}
	if (currentMoment.isAfter(endTime)) {
		throw RangeError('The currentMoment must be before or equal to the endTime.');
	}
	if (startTime.isAfter(endTime)) {
		throw RangeError('The startTime must be before or equal to the endTime.');
	}
	if (endTime.isSame(startTime)) {
		return 1;
	}
	return currentMoment.diff(startTime) / endTime.diff(startTime);
}

/**
 * Takes each moment and converts them into the percentage of time elapsed in
 * its specific period as a decimal from 0 to 1.
 * @param {moment.Moment[]} arrayOfMoments Array of moment objects
 * @param {moment.MomentInputObject} periodLength Object whose keys describe the length of the
 * length of the period, which should be greater than the time step between consecutive moments.
 * @returns {number[]} an array where each element corresponds to the percentage of time elapsed at the
 * the corresponding timestamp in arrayOfMoments
 */
function momenting(arrayOfMoments: moment.Moment[], periodLength: moment.MomentInputObject): number[] {
	const startMoment = arrayOfMoments[0];
	const endMoment = startMoment.clone().add(periodLength);
	const result = arrayOfMoments.map(singleMoment => {
		while (singleMoment.isAfter(endMoment)) {
			startMoment.add(periodLength);
			endMoment.add(periodLength);
		}
		return (_momentPercentage(startMoment, endMoment, singleMoment));
	});
	return result;
}

interface GenerateDataOptions {
	timeStep?: moment.MomentInputObject;
	periodLength?: moment.MomentInputObject;
	maxAmplitude?: number;
}

/**
 * Generates sine data over a period of time. By default the timeStep is 20 minutes.
 * and the period_length is one day.
 * @param {string} startTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {GenerateDataOptions} options controls the timeStep and the period_length, the timeStep needs to be at least
 * 1 second.
 * @returns {[string, string][]} Matrix of rows representing each csv row of the form timeStamp, value
 */
function _generateSineData(startTimeStamp: string, endTimeStamp: string, options: GenerateDataOptions): Array<[string, string]> {
	const chosenOptions: GenerateDataOptions = {
		timeStep: { minute: 20 },
		periodLength: { day: 1 },
		maxAmplitude: 2,
		...options
	};
	const dates = generateDates(startTimeStamp, endTimeStamp, chosenOptions.timeStep);
	const datesAsMoments = dates.map(date => moment(date));
	const halfMaxAmplitude = chosenOptions.maxAmplitude / 2;
	// We take our array of moment percentages and scale it with the half max amplitude
	// and shift it up by that amount.
	const sineValues = momenting(datesAsMoments, chosenOptions.periodLength)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x);
			const scaledResult = halfMaxAmplitude * (isEpsilon(result) ? 0 : result) + halfMaxAmplitude;
			return `${scaledResult}`;
		});
	return (_.zip(dates, sineValues));
}

/** 
 * Write csv data into a csv file
 * @param {[[string, string]]} data an matrix with two columns of strings 
 * @param {string} filename the name of the file
 * Sources:
 * https://csv.js.org/stringify/api/
 * https://stackoverflow.com/questions/2496710/writing-files-in-node-js
 */
async function writeToCSV(data: Array<[string, string]>, filename = 'test.csv') {
	try {
		const output = await stringifyCSV(data); // generate csv data 
		await fs.writeFile(filename, output)
			.then(() => log.info(`The file ${filename} was saved for generating test data.`)) // log success
			.catch(reason => log.error(`Failed to write the file: ${filename}`, reason)); // write data file
	} catch (error) {
		log.error(`Failed to csv-stringify the contents of data: ${JSON.stringify(data)}`, error); // log failure
	}
}

/**
 * This is an object that sets the parameters for generating a data file for OED.
 * 
 * @interface GenerateDataFileOptions
 * @member {string} filename, the name of the data file to be generated
 * @member {boolean} normalizeByHour, if true then we normalize data for OED
 */
interface GenerateDataFileOptions extends GenerateDataOptions {
	filename?: 'test.csv';
	normalizeByHour?: false;
}

/**
 * Creates a csv with sine data
 * 
 * @param {string} startTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {GenerateDataFileOptions} options, the parameters for generating a data file for OED
 */
async function generateSine(startTimeStamp: string, endTimeStamp: string, options: GenerateDataFileOptions) {
	const chosenOptions = {
		timeStep: { minute: 20 },
		periodLength: { day: 1 },
		maxAmplitude: 2,
		...options
	};

	if (chosenOptions.normalizeByHour) {
		const scale = _momentPercentage(moment({ hour: 0 }), moment({ hour: 1 }), moment(chosenOptions.timeStep));
		chosenOptions.maxAmplitude = chosenOptions.maxAmplitude * scale;
	}

	await writeToCSV(_generateSineData(startTimeStamp, endTimeStamp, chosenOptions), options.filename);
}

export = {
	generateDates,
	generateSine,
	writeToCSV,
	momenting,
	_generateSineData
};
