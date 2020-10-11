/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * generateTestData.js exports four functions: 
 * generateDates,
 * generateSine, 
 * write_to_csv,
 * generateSine 
 *
 */

// SHL: I think this should be TypeScript with added types.

// Imports
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');

// SHL: I'm an advocate for big picture comments on how the software features are designed to work.
// This would be the overall design and why it works. I think that helps a lot in understanding what 
// is being done. This is not a requirement and could be a separate document if appropriate.

/**
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound
 * at endDate, which may or may not be included. Because of the date format, 
 * the timeStep should also be at least 1 second. 
 * @param {String} startDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {Object} timeStep Object with keys describe the time step, by default 
 * this is { minute: 20 } or 20 minutes and to at be at least 1 second. 
 * @returns {String[]} An array of timestamps between startDate and endDate, at a given timestep
 * (default 20 minutes). The first element of the output will be the startDate, but the last element
 * may not necessarily be the endDate.
 */
function generateDates(startDate, endDate, timeStep = { minute: 20 }) {
	// Check timeStep is at least 1 second, if not throw an error.
	const temp = moment();
	if (temp.clone().add(timeStep).isBefore(temp.clone().add({ second: 1 }))) {
		throw Error('The timestep needs to be at least 1 second.')
	};
	const array_of_moments = [];
	const startMoment = moment(startDate);
	const endMoment = moment(endDate);
	while (!startMoment.isAfter(endMoment)) {
		array_of_moments.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
		startMoment.add(timeStep);
	};
	return array_of_moments;
} // generateDates

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
	if (endTime.isBefore(startTime)) { throw RangeError('The endTime must be after or equal to the startTime.') };
	if (currentMoment.isBefore(startTime)) { throw RangeError('The currentMoment must be after or equal to the starTime.') };
	if (currentMoment.isAfter(endTime)) { throw RangeError('The currentMoment must be before or equal to the endTime.') };
	if (startTime.isAfter(endTime)) { throw RangeError('The startTime must be before or equal to the endTime.') };

	if (endTime - startTime <= 0) { return 1 };
	return (currentMoment - startTime) / (endTime - startTime);
} // _momentPercentage

/**
 * Takes each moment and converts them into the percentage of time elapsed in 
 * its specific period as a decimal from 0 to 1.
 * @param {moment[]} array_of_moments Array of moment objects 
 * @param {Object} period_length Object whose keys describe the length of the 
 * length of the period, which should be greater than the timestep between 
 * consecutive moments. 
 * @returns {Number[]} an array where each element corresponds to the percentage of time elasped at the
 * the corresponding timestamp in array_of_moments 
 */
function momenting(array_of_moments, period_length) {
	const startMoment = array_of_moments[0];
	const endMoment = startMoment.clone().add(period_length);
	const result = array_of_moments.map(moment => {
		while (moment.isAfter(endMoment)) {
			startMoment.add(period_length);
			endMoment.add(period_length);
		};
		return (_momentPercentage(startMoment, endMoment, moment));
	});
	return result;
} // momenting

/**
 * Checks if a number is really close to zero.
 * @param {Number} number 
 * @param {Number} epsilon our default for what is close to zero is 1e-10
 * @returns {Boolean} whether or not number is really close to zero 
 * @source: https://www.quora.com/In-JavaScript-how-do-I-test-if-a-number-is-close-to-zero
 */
function isEpsilon(number, epsilon = 1e-10) {
	return Math.abs(number) < epsilon;
} // isEpisilon

// SHL: should you describe the format of the Time's? (I think they are allowed moment format?)
/**
 * Generates sine data over a period of time. By default the timeStep is 20 minutes. 
 * and the period_length is one day.
 * @param {String} startTimeStamp 
 * @param {String} endTimeStamp 
 * @param {Object} options controls the timeStep and the period_length, the timeStep needs to be at least
 * 1 second. 
 * @returns {String[][]} Matrix of rows representing each csv row of the form timeStamp, value
 */
function _generateSineData(startTimeStamp, endTimeStamp, options = { timeStep: { minute: 20 }, period_length: { day: 1 }, maxAmplitude: 2 }) {
	const defaultOptions = {
		timeStep: { minute: 20 },
		period_length: { day: 1 },
		maxAmplitude: 2,
		...options,
	}
	const dates = generateDates(startTimeStamp, endTimeStamp, defaultOptions.timeStep);
	const dates_as_moments = dates.map(date => moment(date));
	const halfMaxAmplitude = defaultOptions.maxAmplitude / 2;
	// SHL: I think some comments here (and maybe elsewhere) would help other more readily understand this.
	const sineValues = momenting(dates_as_moments, defaultOptions.period_length)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x);
			const scaledResult = halfMaxAmplitude * (isEpsilon(result) ? 0 : result) + halfMaxAmplitude;
			return `${scaledResult}`;
		});
	return (_.zip(dates, sineValues));
} // _generateSineData

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
function write_to_csv(data, filename = 'test.csv') {
	stringify(data, (err, output) => {
		if (err) {
			return console.log(err);
		}
		fs.writeFile(filename, output, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log("The file was saved!");
		});
	});
} // write_to_csv

// SHL: should options be described?
/**
 * Creates a csv with sine data 
 * @param {String} startTimeStamp 
 * @param {String} endTimeStamp 
 * @param {Object} options 
 */
function generateSine(startTimeStamp, endTimeStamp, options = { filename: 'test.csv', timeStep: { minute: 20 }, period_length: { day: 1 }, maxAmplitude: 2 }) {
	const chosen_data_options = { timeStep: options.timeStep, period_length: options.period_length, maxAmplitude: options.maxAmplitude };
	write_to_csv(_generateSineData(startTimeStamp, endTimeStamp, chosen_data_options), options.filename);
} // generateSine

module.exports = {
	generateDates,
	generateSine,
	write_to_csv,
	momenting,
	_generateSineData
}