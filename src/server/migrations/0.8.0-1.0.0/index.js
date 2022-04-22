/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;
const Unit = require('../../models/Unit');

module.exports = {
	fromVersion: '0.8.0',
	toVersion: '1.0.0',
	up: async db => {
		console.log("YES");
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_displayable_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_unit_represent_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_unit_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/create_units_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/conversion/create_conversions_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_unit_id_default_graphic_unit.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/group/add_default_graphic_unit.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/cik/create_cik_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/create_reading_views.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/drop_old_functions.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/drop_old_views.sql'));
	}
};
