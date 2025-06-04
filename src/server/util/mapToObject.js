/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const zipObject = require('lodash/zipObject');

/**
 * Map an array into an object
 * @param array the array
 * @param valueMapper a function that produces values that should correspond to array
 * elements
 * @returns {Object} An object with key-value pairs item, valueMapper(item) for each item
 * in the array
 */
function mapToObject(array, valueMapper) {
	return zipObject(array, array.map(valueMapper));
}

module.exports = { mapToObject };

