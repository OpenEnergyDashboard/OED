/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment-timezone');

function patchMomentType(pgp) {
	const types = pgp.pg.types;
	// This patches moment.js objects to work with pg-promise.
// See https://github.com/vitaly-t/pg-promise#custom-type-formatting
	moment.fn.formatDBType = function formatDBType() {
		return this.toDate();
	};

// This patches timestamps returned from postgres so that they are moment objects.
	const TIMESTAMPTZ_OID = 1184;
	const TIMESTAMP_OID = 1114;

	types.setTypeParser(TIMESTAMP_OID, function (val) {
		return moment(val); //timestamp without timezone will create moment using UTC time as offset
	});
	types.setTypeParser(TIMESTAMPTZ_OID, moment);

	moment.duration.fn._rawDBType = true; // eslint-disable-line no-underscore-dangle
	moment.duration.fn.formatDBType = function formatDBType() {
		return `'${this.toISOString()}'::INTERVAL`;
	};

	const INTERVAL_OID = 1186;
	types.setTypeParser(INTERVAL_OID, moment.duration);
}

module.exports = patchMomentType;
