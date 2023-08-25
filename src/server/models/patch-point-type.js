/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Point = require('./Point');

/**
 * patches Point object to work with pg-promise.
 * @param pgp
 */
function patchPointType(pgp) {
	const types = pgp.pg.types;

	const POINT_OID = 600;
	types.setTypeParser(POINT_OID,
		/**
		 * parse the string representation of a 'postgres point type' into a {Point}
		 * @param val a string in the form "(floatA,floatB)"
		 * @returns {Point}
		 */
		function (val) {
			const coordinates = val.slice(1, val.length - 1).split(',');
			const parsedCoordinates = coordinates.map(scientific => {
				return Number(scientific);
			});
			return new Point(parsedCoordinates[0], parsedCoordinates[1]);
		});
}

module.exports = patchPointType;
