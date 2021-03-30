/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file was previous rewritten into TypeScript. Due to complications of importing typescript to a JavaScript program.
 * The typescript annotations have been commented out in case the server code will be rewritten to TypeScript.
 */
/**
 * generateTestData.js exports four functions:
 * generateDates,
 * generateSine,
 * writeToCsv,
 * generateCosine,
 * generateSine
 */

// Imports
const fs = require('fs').promises;
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');
const promisify = require('es6-promisify');
const { log } = require('../log');
// import { promises as fs } from 'fs';
// import * as stringify from 'csv-stringify';
// import * as _ from 'lodash';
// import * as moment from 'moment';
// import * as promisify from 'es6-promisify';
// import { log } from '../log';

const stringifyCSV = promisify(stringify);
/* Our main export is the generateSine function. We break this into several parts:
 * 1. Generate the moments in time within a specified range and at a specified time step from a given range.
 * 2. For each moment determine how much time as elapsed (as a decimal) within its respective period.
 * 3. Calculate the value of sine at that moment in time.
 * 		Conceptually this is sin(decimal_percentage * 2 * PI) and it works because the sine function we will
 * 		use is a function of radians and sin(x) = sin(x/P * P * 2 * PI)
 * 4. We zip the array of moments and their corresponding sine values into a matrix,
 * which we will use write into a csv file.
 */

/**
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound at endDate, which may be excluded if it does not lie exactly
 * timeStep (i.e. there is no integer value n such that endDate = startDate + n * timeStep). Because of the date format, the timeStep should also
 * be at least 1 second.
 * @param {string} startDate The start date with the form 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endDate The end date with the form 'YYYY-MM-DD HH:MM:SS'
 * @param {moment.MomentInputObject?} timeStep Object with keys describe the time step, by default
 * this is { minute: 20 } or 20 minutes and needs to be at at least 1 second.
 * @returns {string[]} An array of timestamps between startDate and endDate, at a given time step (default 20 minutes). The first element of the
 * output will be the startDate, but the last element may not necessarily be the endDate.
 */
function generateDates(startDate, endDate, timeStep = { minute: 20 }) {
	// function generateDates(startDate: string, endDate: string, timeStep: moment.MomentInputObject = { minute: 20 }): string[] {
	// Check timeStep is at least 1 second, if not throw an error.
	const temp = moment();
	if (temp.clone().add(timeStep).isBefore(temp.clone().add({ second: 1 }))) {
		throw new Error(`The time step provided is ${JSON.stringify(timeStep)} needs to be at least 1 second.`);
	}
	const arrayOfMoments = [];
	// const arrayOfMoments: string[] = [];
	const startMoment = moment(startDate);
	const endMoment = moment(endDate);
	while (startMoment.isSameOrBefore(endMoment)) {
		arrayOfMoments.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
		startMoment.add(timeStep);
	}
	return arrayOfMoments;
}

/**
 * Determine what percentage of elapsed time passed that is at what percentage if the moment between startTime and endTime.
 * @param {moment.Moment} startTime - should not be after the endTime: !startTime.isAfter(endTime) should return true
 * @param {moment.Moment} endTime - should or be before startTime: !endTime.isBefore(startTime) should return true
 * @param {moment.Moment} currentMoment - should be in between startTime and endTime
 * @returns {number} the percentage of elapsed time between startTime and endTime at currentMoment.
 * @source: https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
 */
function _momentPercentage(startTime, endTime, currentMoment) {
	// function _momentPercentage(startTime: moment.Moment, endTime: moment.Moment, currentMoment: moment.Moment): number {
	// Check pre-conditions
	if (endTime.isBefore(startTime)) {
		throw new RangeError('The endTime must be after or equal to the startTime.');
	}
	if (currentMoment.isBefore(startTime)) {
		throw new RangeError('The currentMoment must be after or equal to the startTime.');
	}
	if (currentMoment.isAfter(endTime)) {
		throw new RangeError('The currentMoment must be before or equal to the endTime.');
	}
	if (startTime.isAfter(endTime)) {
		throw new RangeError('The startTime must be before or equal to the endTime.');
	}
	if (endTime.isSame(startTime)) {
		return 1;
	}
	return currentMoment.diff(startTime) / endTime.diff(startTime);
}

/**
 * Takes each moment and converts them into the percentage of time elapsed in its specific period as a decimal from 0 to 1.
 * @param {moment.Moment[]} arrayOfMoments - Array of moment objects
 * @param {moment.MomentInputObject} periodLength - Moment Input Object whose keys describe length of the period,
 * which should be greater than the time step between consecutive moments.
 * @returns {number[]} - an array where each element corresponds to the percentage of time elapsed at the
 * the corresponding timestamp in arrayOfMoments
 */
function momenting(arrayOfMoments, periodLength) {
	// function momenting(arrayOfMoments: moment.Moment[], periodLength: moment.MomentInputObject): number[] {
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

// interface GenerateDataOptions {
// 	timeStep?: moment.MomentInputObject;
// 	periodLength?: moment.MomentInputObject;
// 	maxAmplitude?: number;
// }

// interface GenerateSinusoidalDataOptions extends GenerateDataOptions {
// 	phaseShift?: number;
// }

/**
 * Generates sine data over a period of time. By default the timeStep is 20 minutes and the periodLength is one day. These can be changed by
 * supplying them in the options parameter.
 * @param {string} startTimeStamp - This is the start time of the data generation; its format needs to be 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endTimeStamp - This is the end time of the data generation; it needs to have the format 'YYYY-MM-DD HH:MM:SS' and may not
 * be included.
 * @param {object?} options - controls the timeStep and the periodLength, the timeStep needs to be at least 1 second.
 * @param {moment.MomentInputObject} options.timeStep - The length of time between two consecutive data points.
 * @param {moment.MomentInputObject} options.periodLength - The length of the period of the generated sine wave.
 * @param {number} options.maxAmplitude - The max height of the generated sine wave.
 * @param {boolean} options.noShift - If false then shift so all values positive, true then no shift.
 * @param {number} options.phaseShift - The amount to phase shift the generated sine wave.
 * @param {boolean} options.squared - Indicates whether output sine data should be squared (if true) or not (if false).
 * @returns {[string, string, string][]} Matrix of rows representing each csv row of the form value, startTimeStamp, endTimeStamp.
 */
function generateSineData(startTimeStamp, endTimeStamp, options = {}) {
	// function generateSineData(startTimeStamp: string, endTimeStamp: string, options: GenerateSinusoidalDataOptions={}): Array<[string, string]> {
	const chosenOptions = {
		// const chosenOptions: GenerateSinusoidalDataOptions = {
		timeStep: options.timeStep || { minute: 20 },
		periodLength: options.periodLength || { day: 1 },
		maxAmplitude: options.maxAmplitude || 2,
		noShift: options.noShift || false,
		phaseShift: options.phaseShift || 0,
		squared: options.squared || false
	};
	const startDates = generateDates(startTimeStamp, endTimeStamp, chosenOptions.timeStep);
	// We create another equally-sized array of timestamps with values that are each shifted
	// forward from the corresponding timestamp in the startDates array by the time step.
	const endDates = startDates.map(date => moment(date).add(options.timeStep).format('YYYY-MM-DD HH:mm:ss'));
	const datesAsMoments = startDates.map(date => moment(date));
	const halfMaxAmplitude = chosenOptions.maxAmplitude / 2;
	// We take our array of moment percentages and scale it with the half max amplitude
	// and shift it up by that amount.
	const sineValues = momenting(datesAsMoments, chosenOptions.periodLength)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x + chosenOptions.phaseShift);
			const scaledResult = chosenOptions.noShift ? result * chosenOptions.maxAmplitude :
				halfMaxAmplitude * result + halfMaxAmplitude;
			// Squares each sine value if desired output is a series of sine-squared values
			return `${chosenOptions.squared ? (scaledResult * scaledResult) : scaledResult}`;
		});
	return (_.zip(sineValues, startDates, endDates));
}

/**
 * Write csv data and header into a csv file
 * @param {[string, string, string]} data - A matrix with three columns of strings
 * @param {string?} filename - The name of the file.
 * @sources:
 * https://csv.js.org/stringify/api/
 * https://stackoverflow.com/questions/2496710/writing-files-in-node-js
 */
async function writeToCsv(data, filename = 'test.csv') {
	try {
		// Assuming \n works on all systems but fine in our Unix containers.
		const header = 'reading,start_timestamp,end_timestamp\n';
		await fs.writeFile(filename, header) // insert header into file
			.catch(reason => log.error(`Failed to write the header to file: ${filename}`, reason));
		// generate csv data
		const output = await stringifyCSV(data);
		// append csv data into file
		await fs.appendFile(filename, output)
			.then(() => log.info(`The file ${filename} was saved for generating test data.`)) // log success
			.catch(reason => log.error(`Failed to write the file: ${filename}`, reason));
	} catch (error) {
		log.error(`Failed to csv-stringify the contents of data: ${JSON.stringify(data)}`, error); // log failure
	}
}

// interface GenerateDataFileOptions extends GenerateDataOptions {
// 	filename?: string;
// 	skipNormalize?: boolean;
// }

// interface GenerateSinusoidalDataFileOptions extends GenerateDataFileOptions {
// 	phaseShift?: number;
// }

/**
 * Creates a csv with sine data
 * @param {string} startTimeStamp - This is the start time of the data generation; its format needs to be 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endTimeStamp - This is the end time of the data generation; it needs to have the format 'YYYY-MM-DD HH:MM:SS'
 * and may not be included. Check the generateDates function for more details.
 * @param {object?} options - The parameters for generating a data file for OED
 * @param {moment.MomentInputObject} options.timeStep - The time step between each data point.
 * @param {moment.MomentInputObject} options.periodLength - The length of the period of the sine wave.
 * @param {number} options.maxAmplitude - The max amplitude of the sine wave.
 * @param {boolean} options.noShift - If false then shift so all values positive, true then no shift.
 * @param {string} options.filename - The name of the csv file containing the sine wave data.
 * @param {boolean} options.skipNormalize - If true skip normalizing data to how OED displays data.
 * @param options.normalizeTime - The time you want to normalize to (1 hour default value)
 * @param {number} options.phaseShift - The amount to phase shift the generated sine wave.
 * @param {boolean} options.squared - Indicates whether output sine data should be squared (if True) or not (if False).
 */
async function generateSine(startTimeStamp, endTimeStamp, options = {}) {
	// async function generateSine(startTimeStamp: string, endTimeStamp: string, options: GenerateSinusoidalDataFileOptions={}) {
	const chosenOptions = {
		// const chosenOptions: GenerateSinusoidalDataFileOptions = {
		timeStep: options.timeStep || { minute: 20 },
		periodLength: options.periodLength || { day: 1 },
		maxAmplitude: options.maxAmplitude || 2,
		noShift: options.noShift || false,
		filename: options.filename || 'test.csv',
		skipNormalize: options.skipNormalize || false,
		// OED line graphs normalize to the hour so you normally don't need to set this value. You might to change
		// the bar graph value to something desired.
		normalizeTime: options.normalizeTime || { hour: 1 },
		phaseShift: options.phaseShift || 0,
		squared: options.squared || false
	};
	try {
		if (!chosenOptions.skipNormalize) {
			// You want to normalize the data to one hour.
			// The idea is you expect OED to show the data at one point per hour so you
			// scale the output to take this into account. This is needed since OED calculates
			// usage at the rate it displays. For example, if you have a point every 20 minutes
			// then you need to scale each point by 1/3 because OED will average the 3 points
			// in that one hour.
			// Set the length of time that OED is going to plot that you want to normalize to.
			// Can use any time frame instead of asMinutes since give full value with decimals.
			let oedTimePoints = moment.duration(chosenOptions.normalizeTime).asMinutes();
			// Set the length of time between points you are generating.
			let step = moment.duration(chosenOptions.timeStep).asMinutes();
			// The ratio is the scale needed.
			const scale = step / oedTimePoints;
			// Now scale the points.
			chosenOptions.maxAmplitude = chosenOptions.maxAmplitude * scale;
		}
		await writeToCsv(generateSineData(startTimeStamp, endTimeStamp, chosenOptions), chosenOptions.filename);
	} catch (error) {
		log.error(`Failed to generate sine data for file: ${chosenOptions.filename}.`, error);
	}
}

/**
 * Creates a csv with cosine data
 * @param {string} startTimeStamp - This is the start time of the data generation; its format needs to be 'YYYY-MM-DD HH:MM:SS'
 * @param {string} endTimeStamp - This is the end time of the data generation; it needs to have the format 'YYYY-MM-DD HH:MM:SS'
 * and may not be included. Check the generateDates function for more details.
 * @param {object?} options - The parameters for generating a data file for OED.
 * @param {moment.MomentInputObject} options.timeStep - The length of time between two consecutive data points.
 * @param {moment.MomentInputObject} options.periodLength - The length of the period of the cosine wave.
 * @param {number} options.maxAmplitude - The max amplitude of the cosine wave.
 * @param {boolean} options.noShift - If false then shift so all values positive, true then no shift.
 * @param {string} options.filename - The name of the csv file containing the cosine wave data.
 * @param {boolean} options.skipNormalize - If true skips normalizing data to how OED displays data.
 * @param options.normalizeTime - The time you want to normalize to (1 hour default value)
 * @param {number} options.phaseShift - The amount to phase shift the generated cosine wave.
 * @param {boolean} options.squared - Indicates whether output sine data should be squared (if True) or not (if False).
 */
async function generateCosine(startTimeStamp, endTimeStamp, options = {}) {
	// async function generateCosine(startTimeStamp: string, endTimeStamp: string, options: GenerateSinusoidalDataFileOptions={}) {
	const chosenOptions = {
		// const chosenOptions: GenerateSinusoidalDataFileOptions = {
		timeStep: options.timeStep || { minute: 20 },
		periodLength: options.periodLength || { day: 1 },
		maxAmplitude: options.maxAmplitude || 2,
		noShift: options.noShift || false,
		filename: options.filename || 'test.csv',
		skipNormalize: options.skipNormalize || false,
		// OED line graphs normalize to the hour so you normally don't need to set this value. You might to change
		// the bar graph value to something desired.
		normalizeTime: options.normalizeTime || { hour: 1 },
		phaseShift: (options.phaseShift || 0) + (Math.PI / 2), // phase shifting by PI/2 converts from sine to cosine.
		squared: options.squared || false
	};
	try {
		if (!chosenOptions.skipNormalize) {
			// You want to normalize the data to one hour.
			// The idea is you expect OED to show the data at one point per hour so you
			// scale the output to take this into account. This is needed since OED calculates
			// usage at the rate it displays. For example, if you have a point every 20 minutes
			// then you need to scale each point by 1/3 because OED will average the 3 points
			// in that one hour.
			// Set the length of time that OED is going to plot that you want to normalize to.
			// Can use any time frame instead of asMinutes since give full value with decimals.
			let oedTimePoints = moment.duration(chosenOptions.normalizeTime).asMinutes();
			// Set the length of time between points you are generating.
			let step = moment.duration(chosenOptions.timeStep).asMinutes();
			// The ratio is the scale needed.
			const scale = step / oedTimePoints;
			// Now scale the points.
			chosenOptions.maxAmplitude = chosenOptions.maxAmplitude * scale;
		}
		await writeToCsv(generateSineData(startTimeStamp, endTimeStamp, chosenOptions), chosenOptions.filename);
	} catch (error) {
		log.error(`Failed to generate cosine data for file: ${chosenOptions.filename}.`, error);
	}
}

module.exports = {
	// export = {
	generateDates,
	generateSine,
	generateSineData,
	generateCosine,
	writeToCsv,
	momenting
};
