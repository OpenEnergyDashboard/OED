/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const _ = require('lodash');

/**
 * Map an array into an object
 * @param array the array
 * @param valueMapper a function that produces values that should correspond to array elements
 * @return {Object} An object with key-value pairs item, valueMapper(item) for each item in the array
 */
function mapToObject(array, valueMapper) {
	return _.zipObject(array, array.map(valueMapper));
}

function compare(a, b) {
	if (a === b) {
		return 0;
	}

	const partsA = a.split('.');
	const partsB = b.split('.');

	const len = Math.min(partsA.length, partsB.length);

	// loop while the components are equal
	for (let i = 0; i < len; i++) {
		// A bigger than B
		if (parseInt(partsA[i]) > parseInt(partsB[i])) {
			return 1;
		}

		// B bigger than A
		if (parseInt(partsA[i]) < parseInt(partsB[i])) {
			return -1;
		}
	}

	// If one's a prefix of the other, the longer one is greater.
	if (partsA.length > partsB.length) {
		return 1;
	}

	if (partsA.length < partsB.length) {
		return -1;
	}

	// Otherwise they are the same.
	return 0;
}

function findMaxSemanticVersion(list) {
	let max = list[0];

	list.forEach(item => {
		if (compare(item, max) === 1) {
			max = item;
		}
	});

	return max;
}

module.exports = {
	mapToObject,
	findMaxSemanticVersion
};
