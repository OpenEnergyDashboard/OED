/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file exports two useful items: testDB, which provides the method .getConnection,
 * returning a connection to the testing database, and recreateDB, which destroys the
 * database and creates a new schema there.
 */

var TWO_PI = Math.PI * 2;

/* Test 1: Sine Function
 * We have a proper sin function
 */
const test1 = (sin(0) == Math.sin(0)) && (sin(Math.PI * 2) == Math.sin(Math.PI * 2)) && (sin(Math.PI) == Math.sin(Math.PI))
console.log(`Test 1: We should have a proper sin function: ${test1}`)

/* Test 2: Sine Wave
 * We have a function that takes an array of numbers(x-values) and returns the value of the 
 * Sine wave on that numbers
 */
const test2 = arraysMatch(sineWave([0]), [0].map(Math.sin)) && arraysMatch(sineWave([0, TWO_PI]), [0, TWO_PI].map(Math.sin))
console.log(`Test 2: We should have a proper sine wave function: ${test2}`)

/* Functions
 */

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

/* Testing functions
 */

/* Compare if two arrays are equivalent
 * Taken from https://gomakethings.com/how-to-check-if-two-arrays-are-equal-with-vanilla-js/
 */
function arraysMatch(arr1, arr2) {

	// Check if the arrays are the same length
	if (arr1.length !== arr2.length) return false;

	// Check if all items exist and are in the same order
	for (var i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false;
	}

	// Otherwise, return true
	return true;

};
