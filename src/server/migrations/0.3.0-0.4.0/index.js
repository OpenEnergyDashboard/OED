/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../../models/database');
const { log } = require('../../log');
const sqlFile = database.sqlFile;

module.exports = {
	fromVersion: '0.3.0',
	toVersion: '0.4.0',
	up: async db => {
		try {
			// await db.none(sqlFile('../migrations/0.3.0-0.4.0/sql/preferences/create_language_types_enum.sql'));
			await db.none(sqlFile('../migrations/0.3.0-0.4.0/sql/preferences/add_lansguage_column.sql'));
		} catch (err) {
			throw new Error('Cannot migrate');
		}
	}
};
