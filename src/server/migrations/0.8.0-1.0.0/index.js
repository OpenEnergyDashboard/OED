/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.8.0',
	toVersion: '1.0.0',
	up: async db => {
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_displayable_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_unit_represent_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_unit_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/create_units_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/conversion/create_conversions_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/unit/add_area_unit_types.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/preferences/add_preferences_default_area.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/preferences/add_preferences_default_meter_reading_frequency.sql'));
		// Insert default units and conversions into the database. 
		// This file should be called before these values are used for meters and groups.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_default_units_and_conversions.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_unit_id_default_graphic_unit_area_unit.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/alter_meter_time_holders.sql'));
		// Note that default units and conversions must be inserted before calling this file.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/update_unit_id_default_graphic_unit.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/group/add_default_graphic_unit_area_unit.sql'));
		// Note that default units and conversions must be inserted before calling this file.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/group/update_default_graphic_unit.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/cik/create_cik_table.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/drop_old_views.sql'));
		// Note that old views should be dropped before the reading's type is changed to float.
		// It is also important that the creation of new views below is done after this because
		// you cannot alter a type that is used in a view.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/set_reading_to_float.sql'));
		// Need to create type before reading views since it is needed there.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/add_reading_line_accuracy_type.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/set_function_get_compare_readings_to_float.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/create_reading_views.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/readings/drop_old_functions.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_meter_type.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/alter_meter_ipAddress.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_meter_reading_frequency.sql'));
		// This sql code creates a function that is used in the new meter's constraints.
		// Hence, it's needed to be added before executing add_constraints.sql.
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/check_timezone.sql'));
		await db.none(sqlFile('../migrations/0.8.0-1.0.0/sql/meter/add_constraints.sql'));
	}
};
