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

// SHL: I don't see where this might allow making the value not be -1 to 1.
// Meter data generally goes from 0 to some max value.

// Imports
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');

// Global Constants
var TWO_PI = Math.PI * 2;

// SHL: I'm an advocate for big picture comments on how the software features are designed to work.
// This would be the overall design and why it works. I think that helps a lot in understanding what 
// is being done. This is not a requirement and could be a separate document if appropriate.

/**
 * 
 * @param {String} startDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * SHL: maybe make default 20 minutes.
 * @param {Object} timeStep Object with keys describe the time step, by default 
 * this is { ms: 15000 } or 15 seconds. 
 * 
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound
 * at endDate, which may or may not be included. Because of the date format, 
 * the timeStep should also be at least 1 second. 
 */
function generateDates(startDate, endDate, timeStep = { ms: 15000 }) {
	// SHL: check timeStep is at least 1 second and maybe error if not (or return empty values?).
	const array_of_moments = [];
	const startMoment = moment(startDate);
	const endMoment = moment(endDate);
	while (!startMoment.isAfter(endMoment)) {
		array_of_moments.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
		startMoment.add(timeStep);
	}
	return array_of_moments;
} // generateDates

/**
 * 
 * @param {moment} startTime should not be after the endTime: !startTime.isAfter(endTime) should return true 
 * @param {moment} endTime should or be before startTime: !endTime.isBefore(startTime) should return true 
 * @param {moment} currentMoment should be in between startTime and endTime 
 * 
 * Determine what percentage of elapsed time passed that is at what percentage 
 * if the moment between startTime and endTime.
 * Source: https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
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
 * 
 * @param {Array[moment]} array_of_moments Array of moment objects 
 * @param {Object} period_length Object whose keys describe the length of the 
 * length of the period, which should be greater than the timestep between 
 * consecutive moments. 
 * 
 * Takes each moment and converts them into the percentage of time elapsed in 
 * its specific period as a decimal from 0 to 1.
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
 * 
 * @param {Number} number 
 * 
 * Checks if a number is really close to zero.
 * Source: https://www.quora.com/In-JavaScript-how-do-I-test-if-a-number-is-close-to-zero
 */
function isEpsilon(number, epsilon = 1e-10) {
	return Math.abs(number) < epsilon;
} // isEpisilon

// SHL: should you describe the format of the Time's? (I think they are allowed moment format?)
// SHL: Your descriptions of methods don't include return info.
/**
 * 
 * @param {String} startTimeStamp 
 * @param {String} endTimeStamp 
 * @param {Object} options controls the timeStep and the period_length 
 * 
 * Generates sine data over a period of time. By default the timeStep is 1 day 
 * and the period_length is one day.
 */
function _generateSineData(startTimeStamp, endTimeStamp, options = { timeStep: { hour: 12 }, period_length: { day: 1 } }) {
	const defaultOptions = {
		timeStep: { hour: 12 },
		period_length: { day: 1 },
		...options,
	}
	const dates = generateDates(startTimeStamp, endTimeStamp, defaultOptions.timeStep);
	const dates_as_moments = dates.map(date => moment(date));
	// SHL: I think some comments here (and maybe elsewhere) would help other more readily understand this.
	const sineValues = momenting(dates_as_moments, defaultOptions.period_length)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x);
			return (isEpsilon(result) ? '0' : `${result}`)
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
 * 
 * @param {String} startTimeStamp 
 * @param {String} endTimeStamp 
 * @param {Object} options 
 * 
 * Creates a csv with sine data 
 */
function generateSine(startTimeStamp, endTimeStamp, options = { filename: 'test.csv', timeStep: { hour: 12 }, period_length: { day: 1 } }) {
	const chosen_data_options = { timeStep: options.timeStep, period_length: options.period_length };
	write_to_csv(_generateSineData(startTimeStamp, endTimeStamp, chosen_data_options), options.filename);
} // generateSine

module.exports = {
	generateDates,
	generateSine,
	write_to_csv,
	momenting,
	_generateSineData
}