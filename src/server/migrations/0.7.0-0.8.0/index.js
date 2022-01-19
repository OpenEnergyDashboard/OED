/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.7.0',
	toVersion: '0.8.0',
	up: async db => {
		await db.none(sqlFile('../migrations/0.7.0-0.8.0/sql/preferences/add_preferences_raw_limits.sql'));
		await db.none(sqlFile('../migrations/0.7.0-0.8.0/sql/preferences/alter_preferences_type.sql'));
		await db.none(sqlFile('../migrations/0.7.0-0.8.0/sql/readings/create_materialized_hourly_readings.sql'));
		await db.none(sqlFile('../migrations/0.7.0-0.8.0/sql/readings/drop_minutely_readings.sql'));
		await db.none(sqlFile('../migrations/0.7.0-0.8.0/sql/readings/replace_compressed_readings_2.sql'));
	}
};
