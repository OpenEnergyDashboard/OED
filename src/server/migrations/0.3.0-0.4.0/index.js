/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const sqlFile = database.sqlFile;

// Export as an object with to and from versions and a function to try to run all listed sql files.
module.exports = {
	fromVersion: '0.3.0',
	toVersion: '0.4.0',
	up: async db => {
		try {
			await db.none(sqlFile('../migrations/0.3.0-0.4.0/sql/preferences/create_language_types_enum.sql'));
			await db.none(sqlFile('../migrations/0.3.0-0.4.0/sql/preferences/add_language_column.sql'));
			await db.none(sqlFile('../migrations/0.3.0-0.4.0/sql/logemail/create_log_table.sql'));
		} catch (err) {
			throw new Error('Error while migrating each sql file');
		}
	}
};
