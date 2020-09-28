/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//import
const fs = require('fs');
const stringify = require('csv-stringify');
const _ = require('lodash');

var TWO_PI = Math.PI * 2;

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
	let moment = 1;
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
			moment = 1;
		} else if (idx === array_from_start_to_end.length - 1) {
			accumulator.push(buffer);
			return accumulator;
		} else {
			moment++;
		}
	})
	function periodReached(buffer, period) {
		return (buffer[buffer.length - 1] - buffer[0] + 1 === period);
	}
	return accumulator;
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
	sineWave,
	sample,
	sectionInterval,
	sineOverEmbeddedPercentages,
	waveGenerator,
	write_to_csv,
}
