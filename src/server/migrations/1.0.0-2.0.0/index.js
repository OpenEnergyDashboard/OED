/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

module.exports = {
    fromVersion: '1.0.0',
    toVersion: '2.0.0',
    up: async db => {
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/readings/create_reading_views.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/meter/add_meter_pipeline_checks.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/preferences/add_preferences_pipeline_checks.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/preferences/add_graph_type.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/preferences/add_preferences_help_url.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/users/add_users_note.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/users/alter_users_table.sql'));
        // It should not matter but first rename cik and then do units.
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/cik/alter_cik_table.sql'));
        await db.none(sqlFile('../migrations/1.0.0-2.0.0/sql/units/alter_units_table.sql'));
    }
};
