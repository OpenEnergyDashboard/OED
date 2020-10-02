/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * 
 * I only need three functions to export to test.
 * I only need to export one function that does those function
 * functions do sequentially requested.
 * 	I need to incorporate the period of the sine wave within each period.
 * 	Which has the purpose of giving more control to each of those sine waves.
 * First I need a function that generates the dates from one period to another at a 
 * certain time-step. 
 */

//import
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');
const moment = require('moment');

var TWO_PI = Math.PI * 2;

/**
 * 
 * @param {String} startDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {String} endDate String of the form 'YYYY-MM-DD HH:MM:SS'
 * @param {Object} timeStep Object with keys describe the time step, by default 
 * this is { ms: 15000 } or 15 seconds. 
 * 
 * Generates an array of dates of the form 'YYYY-MM-DD HH:MM:SS' with the upper bound
 * at endDate, which may or may not be included. Because of the date format, 
 * the timeStep should also be at least 1 second. 
 */
function generateDates(startDate, endDate, timeStep = { ms: 15000 }) {
	const array_of_moments = [];
	const startMoment = moment(startDate);
	const endMoment = moment(endDate);
	while (!startMoment.isAfter(endMoment)) {
		array_of_moments.push(startMoment.format('YYYY-MM-DD HH:mm:ss'));
		startMoment.add(timeStep);
	}
	return array_of_moments;
} // generateDates(String,String,Object)

/**
 * 
 * @param {moment} startTime should not be after the endTime: !startTime.isAfter(endTime) should return true 
 * @param {moment} endTime should or be before startTime: !endTime.isBefore(startTime) should return true 
 * @param {moment} moment should be in between startTime and endTime 
 * 
 * Determine what percentage of elapsed time passed that is at what percentage 
 * if the moment between startTime and endTime.
 * Source: https://stackoverflow.com/questions/18960327/javascript-moment-js-calculate-percentage-between-two-dates
 */
function moment_percentage(startTime, endTime, moment) {
	if (endTime - startTime <= 0) return 1;
	return (moment - startTime) / (endTime - startTime);
} // moment_percentage(moment,moment,moment)

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
		}
		return (moment_percentage(startMoment, endMoment, moment))
	});
	return result;
} // momenting(Array[moment],Object)

/**
 * 
 * @param {Number} number 
 * 
 * Checks if a number is really close to zero.
 * Source: https://www.quora.com/In-JavaScript-how-do-I-test-if-a-number-is-close-to-zero
 */
function isEpsilon(number) {
	return Math.abs(number) < 1e-10;
} // isEpisilon(Number)

/**
 * 
 * @param {String} startTimeStamp 
 * @param {String} endTimeStamp 
 * @param {Object} options controls the timeStep and the period_length 
 * 
 * Generates sine data over a period of time. By default the timeStep is 1 day 
 * and the peiord_length is one day.
 */
function _generateSineData(startTimeStamp, endTimeStamp, options = { timeStep: { day: 1 }, period_length: { day: 1 } }) {
	const defaultOptions = {
		timeStep: { day: 1 },
		period_length: { day: 1 },
		...options,
	}
	const dates = generateDates(startTimeStamp, endTimeStamp, defaultOptions.timeStep);
	const dates_as_moments = dates.map(date => moment(date));
	const sineValues = momenting(dates_as_moments, defaultOptions.period_length)
		.map(x => {
			const result = Math.sin(Math.PI * 2 * x);
			return (isEpsilon(result) ? 0 : result)
		});
	return (_.zip(dates, sineValues));
} // _generateSineData(String,String,Object)


// https://github.com/nodebox/g.js/blob/master/src/libraries/math.js#L315
// https://itnext.io/heres-why-mapping-a-constructed-array-doesn-t-work-in-javascript-f1195138615a
function sample(min, max, steps) {
	const stepSize = (max - min) / steps;
	const result = [...Array(steps + 1)].map((_, i) => min + i * stepSize);
	return result;
}
/* A function that determines the value of sine at a given x-value
 */
function sin(x, options = {}) {
	return Math.sin(x);
}

/* A function that takes an array of x-values and 
 * returns an array of sin at each corresponding x-value
 */
function sineWave(array, options = {}) {
	return array.map(x => [x, Math.sin(x)])
}

/** */
function waveGenerator(min, max, steps, waveFunction, options = {}) {
	const inputs = sample(min, max, steps);
	return waveFunction(inputs, options);
}

/** data needs to be of form
 * 
 * [
 * [...row],
 * [...row],
 * [...row],
 * 
 * ]
 */
// https://csv.js.org/stringify/api/
// https://stackoverflow.com/questions/2496710/writing-files-in-node-js
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
}

// we assume that the diff between consecutive array elements are equal
/* Given an array of something creat
 * Parameters: an array of moments, period
 * account for day in period, percentage
 */
function sectionInterval(array_from_start_to_end, period) {
	let buffer = [];
	const accumulator = [];
	if (array_from_start_to_end.length === 0) {
		return [];
	}
	array_from_start_to_end.forEach((element, idx) => {
		buffer.push(element);
		if (periodReached(buffer, period)) {
			accumulator.push(buffer);
			buffer = [];
		} else if (idx === array_from_start_to_end.length - 1) {
			accumulator.push(buffer);
			return accumulator;
		}
	});
	function periodReached(buffer, period) {
		return (buffer[buffer.length - 1] - buffer[0] + 1 === period);
	}
	return accumulator;
}

// chunk moments
// we assume that the period is greater than the difference
// between two consecutive moments
// period in milliseconds
function chunkMoments(array_of_moments, period) {
	if (array_of_moments.length <= 1) {
		return array_of_moments;
	}
	// initialize the buffer
	let buffer = [array_of_moments[0]];
	const moments = array_of_moments.slice(1);
	const accumulator = [];
	moments.forEach((element, idx) => {
		if (exceedsPeriod(buffer[0], element)) {
			// adding the next element would cause the
			// period of the buffer to exceed the specified period
			accumulator.push(buffer);
			buffer = [element];
		} else {
			// adding next element is safe
			buffer.push(element);
		}
		if (idx === moments.length - 1) {
			accumulator.push(buffer);
		}
	});
	function exceedsPeriod(startTime, endTime) {
		return endTime.diff(startTime) - period > 0;
	}
	return accumulator;
}

// should bin moments
// i.e. 00:00, 00:15, 00:30 for 00:15 => 00:00, 00:15
function bin_moments(moments_array, period) {
	if (moments_array.length < 1) return moments_array;
}

// convert moments into percentages
// we assume that the first moment of the first subarray in the moments_array
// is the date of the entire period
function nested_moments(moments_array, period = 0) {
	if (moments_array.length === 0)
		return [];
	const beginning_of_period = moments_array[0][0];
	const moments_into_percentages = moments_array.map(moments => {
		if (moments.length === 1) return [1]
		const startDate = moments[0];
		const endDate = moments[moments.length - 1];
		// inaccurate when array is not properly aligned or diff'd
		return moments.map(single_moment => moment_percentage(startDate, endDate, single_moment))
	})

	return moments_into_percentages;
}

function _period_of_moments_to_portion(array_of_moments, start = null, end = null) {
	if (array_of_moments.length == 1) return [1]
	const startMoment = start || array_of_moments[0];
	const endMoment = end || array_of_moments[array_of_moments.length - 1];
	const result = [];
	array_of_moments.forEach(moment => result.push(
		moment_percentage(startMoment, endMoment, moment)));
	return result;
}
// main
function momenting(array_of_moments, period_length) {
	const startMoment = array_of_moments[0];
	const endMoment = startMoment.clone().add(period_length);
	const result = array_of_moments.map(moment => {
		while (moment.isAfter(endMoment)) {
			startMoment.add(period_length);
			endMoment.add(period_length);
		}
		return (moment_percentage(startMoment, endMoment, moment))
	});
	return result;
}

// apply the sin funciton on each percentaged moment
function sineOverEmbeddedPercentages(array_of_embedded_percentages) {
	if (array_of_embedded_percentages.length === 0) {
		return [];
	} else {
		return _.flatten(array_of_embedded_percentages.map(array_of_percentages => (array_of_percentages.map(result))))
	}
	function result(percentage) {
		return Math.sin(percentage * TWO_PI);
	}
}

module.exports = {
	bin_moments,
	chunkMoments,
	generateDates,
	nested_moments,
	sineWave,
	sample,
	sectionInterval,
	sineOverEmbeddedPercentages,
	waveGenerator,
	write_to_csv,
	_period_of_moments_to_portion,
	momenting,
	_generateSineData
}
