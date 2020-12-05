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
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');

const { log } = require('../log');

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
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound
 * at endDate, which may or may not be included. Because of the date format,
 * the timeStep should also be at least 1 second.
 * @param {String} startDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {Object} timeStep Object with keys describe the time step, by default
 * this is { minute: 20 } or 20 minutes and to at be at least 1 second.
 * @returns {String[]} An array of timestamps between startDate and endDate, at a given time step
 * (default 20 minutes). The first element of the output will be the startDate, but the last element
 * may not necessarily be the endDate.
 */
function generateDates(startDate, endDate, timeStep = { minute: 20 }) {
	// Check timeStep is at least 1 second, if not throw an error.
	const temp = moment();
	if (temp.clone().add(timeStep).isBefore(temp.clone().add({ second: 1 }))) {
		throw Error(`The time step provided is ${JSON.stringify(timeStep)} needs to be at least 1 second.`);
	}
	const arrayOfMoments = [];
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
 * @param {moment} startTime should not be after the endTime: !startTime.isAfter(endTime) should return true
 * @param {moment} endTime should or be before startTime: !endTime.isBefore(startTime) should return true
 * @param {moment} currentMoment should be in between startTime and endTime
 * @source: https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
 */
function _momentPercentage(startTime, endTime, currentMoment) {
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

	if (endTime - startTime <= 0) {
		return 1;
	}
	return (currentMoment - startTime) / (endTime - startTime);
}

/**
 * Takes each moment and converts them into the percentage of time elapsed in
 * its specific period as a decimal from 0 to 1.
 * @param {moment[]} arrayOfMoments Array of moment objects
 * @param {Object} periodLength Object whose keys describe the length of the
 * length of the period, which should be greater than the time step between
 * consecutive moments.
 * @returns {Number[]} an array where each element corresponds to the percentage of time elapsed at the
 * the corresponding timestamp in arrayOfMoments
 */
function momenting(arrayOfMoments, periodLength) {
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

/**
 * Checks if a number is really close to zero.
 * @param {Number} x
 * @param {Number} epsilon our default for what is close to zero is 1e-10
 * @returns {Boolean} whether or not number is really close to zero
 * @source: https://www.quora.com/In-JavaScript-how-do-I-test-if-a-number-is-close-to-zero
 */
function isEpsilon(x, epsilon = 1e-10) {
	return Math.abs(x) < epsilon;
} // isEpsilon

/**
 * Generates sine data over a period of time. By default the timeStep is 20 minutes.
 * and the period_length is one day.
 * @param {String} startTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {Object} options controls the timeStep and the period_length, the timeStep needs to be at least
 * 1 second.
 * @returns {String[][]} Matrix of rows representing each csv row of the form timeStamp, value
 */
function _generateSineData(startTimeStamp, endTimeStamp, options = { timeStep: { minute: 20 }, periodLength: { day: 1 }, maxAmplitude: 2 }) {
	const defaultOptions = {
		timeStep: { minute: 20 },
		periodLength: { day: 1 },
		maxAmplitude: 2,
		...options
	};
	const dates = generateDates(startTimeStamp, endTimeStamp, defaultOptions.timeStep);
	const datesAsMoments = dates.map(date => moment(date));
	const halfMaxAmplitude = defaultOptions.maxAmplitude / 2;
	// We take our array of moment percentages and scale it with the half max amplitude
	// and shift it up by that amount.
	const sineValues = momenting(datesAsMoments, defaultOptions.periodLength)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x);
			const scaledResult = halfMaxAmplitude * (isEpsilon(result) ? 0 : result) + halfMaxAmplitude;
			return `${scaledResult}`;
		});
	return (_.zip(dates, sineValues));
}

/** data needs to be of form
 *
 * [
 * ...
 * [...row]_generateSineData(startTimeStamp, endTimeStamp),
 * [...row],
 * [...row],
 * ...
 * ]
 *
 * Sources:
 * https://csv.js.org/stringify/api/
 * https://stackoverflow.com/questions/2496710/writing-files-in-node-js
 */
function writeToCSV(data, filename = 'test.csv') {
	stringify(data, (stringifyErr, output) => {
		if (stringifyErr) {
			log.error(stringifyErr);
		}
		fs.writeFile(filename, output, err => {
			if (err) {
				return log.error(err);
			}
			log.info(`The file ${filename} was saved for generating test data.`);
		});
	});
}

/**
 * Creates a csv with sine data
 * @param {String} startTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endTimeStamp, the time's format is 'YYYY-MM-DD HH:MM:SS'
 * @param {Object} options, options is an object that will be parsed by
 * moment.js. The format should be {unit: value, ...}. Examples are shown
 * in the link below:
 * @source: https://momentjs.com/docs/#/parsing/object/
 */
function generateSine(
	startTimeStamp,
	endTimeStamp,
	options = {
		filename: 'test.csv',
		timeStep: { minute: 20 },
		periodLength: { day: 1 },
		maxAmplitude: 2
	}) {
	const chosenDataOptions = { timeStep: options.timeStep, periodLength: options.periodLength, maxAmplitude: options.maxAmplitude };
	writeToCSV(_generateSineData(startTimeStamp, endTimeStamp, chosenDataOptions), options.filename);
}

module.exports = {
	generateDates,
	generateSine,
	writeToCSV,
	momenting,
	_generateSineData
};