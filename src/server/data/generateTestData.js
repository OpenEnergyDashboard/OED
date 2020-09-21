/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//import
const fs = require('fs');
const stringify = require('csv-stringify');

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

module.exports = {
	sineWave,
	sample,
	waveGenerator,
	write_to_csv,
}
