/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '2.0.0',
	toVersion: '2.1.0',
	up: async db => {
		await db.none(sqlFile('../migrations/2.0.0-2.1.0/sql/holiday/create_holidays_table.sql'));
		await db.none(sqlFile('../migrations/2.0.0-2.1.0/sql/holidayInstance/create_holiday_instance_table.sql'));
		await db.none(sqlFile('../migrations/2.0.0-2.1.0/sql/holidayInstanceGroup/create_holiday_instance_group_table.sql'));
		await db.none(sqlFile('../migrations/2.0.0-2.1.0/sql/holidayGroupMember/create_holiday_group_members_table.sql'));
		await db.none(sqlFile('../migrations/2.0.0-2.1.0/sql/week/add_holiday_instance_group_id.sql'));
	}
};
