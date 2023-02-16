/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 module.exports = {
	fromVersion: '1.0.0',
	toVersion: '1.1.0',
	up: async db => {
		await db.none(sqlFile('../migrations/1.1.0-1.1.0/sql/preferences/add_preferences_default_area_normalization.sql'));
	}
};
