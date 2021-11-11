/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.6.0',
	toVersion: '0.7.0',
	up: async db => {
		await db.none(sqlFile('../migrations/0.6.0-0.7.0/sql/group/add_displayable_gps_note_area_columns.sql'));
		await db.none(sqlFile('../migrations/0.6.0-0.7.0/sql/map/add_north_angle_and_circle_fraction.sql'));
		await db.none(sqlFile('../migrations/0.6.0-0.7.0/sql/meter/add_meter_type.sql'));
		await db.none(sqlFile('../migrations/0.6.0-0.7.0/sql/meter/add_multiple_db_meters_columns.sql'));
		await db.none(sqlFile('../migrations/0.6.0-0.7.0/sql/user/add_user_role.sql'));
	}
};
