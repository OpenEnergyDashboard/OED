/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
	return array.map(Math.sin)
}

module.exports = {
	sineWave,
	sample
}
