/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');

const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.3.0',
	toVersion: '0.4.0',
	up: async db => {
		// migration here
		await db.none(sqlFile('preferences/create_language_types_enum.sql'));
		await db.none(sqlFile('preferences/add_language_column.sql'));
	}
};
