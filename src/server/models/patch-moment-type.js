/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

function patchMomentType(pgp) {
	const types = pgp.pg.types;
	// This patches moment.js objects to work with pg-promise.
	// See https://github.com/vitaly-t/pg-promise#custom-type-formatting
	moment.fn.toPostgres = function toPostgres() {
		// Return the string representing the moment (this) to be the same date/time (without any timezone shifts)
		// at UTC (+00:00). This is to put moment objects into the database.
		return this.format('YYYY-MM-DD HH:mm:ss') + '+00:00';
	};

	// This patches timestamps returned from postgres so that they are moment objects.
	const TIMESTAMPTZ_OID = 1184;
	const TIMESTAMP_OID = 1114;

	types.setTypeParser(TIMESTAMP_OID, function (val) {
		// Return the moment that represent the time string (val) at UTC (+00:00) without any timezone shifts.
		// The is for returning the string that stores date/times in the database to moments for use in the code.
		return moment.parseZone(val + '+00:00', undefined, true);
	});
	types.setTypeParser(TIMESTAMPTZ_OID, moment);

	moment.duration.fn.rawType = true; // eslint-disable-line no-underscore-dangle
	moment.duration.fn.toPostgres = function toPostgres() {
		return `'${this.toISOString()}'::INTERVAL`;
	};

	const INTERVAL_OID = 1186;
	types.setTypeParser(INTERVAL_OID, moment.duration);
}

module.exports = patchMomentType;
