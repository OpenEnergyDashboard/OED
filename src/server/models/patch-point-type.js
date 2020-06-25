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
	types.setTypeParser(POINT_OID, function (val) {
		const coordinates = val.slice(1, val.length-1).split(',');
		const parsedCoordinates = coordinates.map(scientific => {
			const integerAndExponent = scientific.split('e');
			const integer = parseInt(integerAndExponent[0]);
			const exponentSign = integerAndExponent[1].charAt(0);
			const exponentNumber = parseInt(integerAndExponent[1].substr(1));
			return exponentSign === '+'? integer * Math.pow(10, exponentNumber): integer / Math.pow(10, exponentNumber)
		});
		return new Point(parsedCoordinates[0], parsedCoordinates[1]);
	});
}

module.exports = patchPointType;
