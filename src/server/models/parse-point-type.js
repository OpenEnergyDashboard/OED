/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function Point(x, y) {
	this.x = x;
	this.y = y;

	// Custom Type Formatting:
	this._rawDBType = true; // to make the type return the string without escaping it;

	this.formatDBType = function () {
		return `point(${this.x}, ${this.y})`;
	};
}

module.exports = Point;
