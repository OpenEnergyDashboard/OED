/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const db = database.db;
const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {Integer} userID - The id of the user with the preferences
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultGraphType - Graph to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 */
	constructor(userID, displayTitle, defaultGraphType, defaultBarStacking) {
		this.userID = userID;
		this.displayTitle = displayTitle;
		this.defaultGraphType = defaultGraphType;
		this.defaultBarStacking = defaultBarStacking;
	}

	/**
	 * Returns a promise to create the preferences table
	 * @returns {Promise.<>}
	 */
	static createTable() {
		return db.none(sqlFile('preferences/create_preferences_table.sql'));
	}

	/**
	 * Returns a promise to create the graph_type type.
	 * This needs to be run before Preferences.createTable().
	 * @return {Promise<void>}
	 */
	static createGraphTypesEnum() {
		return db.none(sqlFile('preferences/create_graph_types_enum.sql'));
	}
}

module.exports = Preferences;
