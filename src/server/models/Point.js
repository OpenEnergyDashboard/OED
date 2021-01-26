/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * transform data passed from frontend into objects acceptable for postgres
 * postgres store points in the format: longitude, latitude
 * @param longitude
 * @param latitude
 * @constructor
 */
function Point(longitude, latitude) {
	this.longitude = longitude;
	this.latitude = latitude;

	// Custom Type Formatting:
	this.rawType = true; // to make the type return the string without escaping it;

	this.toPostgres = function toPostgres() {
		return `point(${this.longitude}, ${this.latitude})`;
	};
}

module.exports = Point;
