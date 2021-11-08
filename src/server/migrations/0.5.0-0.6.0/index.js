/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.5.0',
	toVersion: '0.6.0',
	up: async db => {
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/map/create_maps_table.sql'));
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/meter/add_gps_column.sql'));
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/meter/add_identifier_column.sql'));
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/meter/add_meters_default_timezone.sql'));
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/preferences/add_language_types_enum.sql'));
		await db.none(sqlFile('../migrations/0.5.0-0.6.0/sql/preferences/add_preferences_default_timezone.sql'));
	}
};
