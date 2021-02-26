/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');

function patchMomentType(pgp) {
	const types = pgp.pg.types;
	// This patches momentjs objects to work with pg-promise.
// See https://github.com/vitaly-t/pg-promise#custom-type-formatting
	moment.fn.toPostgres = function toPostgres() {
		return this.toDate();
	};

// This patches timestamps returned from postgres so that they are moment objects.
	const TIMESTAMPTZ_OID = 1184;
	const TIMESTAMP_OID = 1114;

	types.setTypeParser(TIMESTAMP_OID, moment);
	types.setTypeParser(TIMESTAMPTZ_OID, moment);

	moment.duration.fn.rawType = true; // eslint-disable-line no-underscore-dangle
	moment.duration.fn.toPostgres = function toPostgres() {
		return `'${this.toISOString()}'::INTERVAL`;
	};

	const INTERVAL_OID = 1186;
	types.setTypeParser(INTERVAL_OID, moment.duration);
}

module.exports = patchMomentType;
