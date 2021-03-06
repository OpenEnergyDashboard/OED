/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const database = require('./database');

const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultChartToRender - Chart to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 * @param {String} defaultLanguage - Option to set the default language
	 * @param {String} defaultTimezone - Option to set the default timezone
	 */
	constructor(displayTitle, defaultChartToRender, defaultBarStacking, defaultLanguage, defaultTimezone) {
		this.displayTitle = displayTitle;
		this.defaultChartToRender = defaultChartToRender;
		this.defaultBarStacking = defaultBarStacking;
		this.defaultLanguage = defaultLanguage;
		this.defaultTimezone = defaultTimezone;
	}

	/**
	 * Returns a promise to create the preferences table and associated enums
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static async createTable(conn) {
		await conn.none(sqlFile('preferences/create_graph_types_enum.sql'));
		await conn.none(sqlFile('preferences/create_language_types_enum.sql'));
		await conn.none(sqlFile('preferences/create_preferences_table.sql'));
		await conn.none(sqlFile('preferences/insert_default_row.sql'));
	}


	/**
	 * Creates a new set of preferences from the data in a row.
	 * @param row the row from which the preferences object is to be created
	 * @returns Preference object from row
	 */
	static mapRow(row) {
		return new Preferences(row.display_title, row.default_chart_to_render, row.default_bar_stacking, row.default_language, row.default_timezone);
	}

	/**
	 * Get the preferences from the database.
	 * @param conn is the connection to use.
	 */
	static async get(conn) {
		const row = await conn.one(sqlFile('preferences/get_preferences.sql'));
		return Preferences.mapRow(row);
	}

	/**
	 * Update the preferences in the database.
	 * @param conn the database connection to use.
	 */
	static async update(newPreferences, conn) {
		const preferences = await Preferences.get(conn);
		_.merge(preferences, newPreferences);
		await conn.none(sqlFile('preferences/update_preferences.sql'),
			{
				displayTitle: preferences.displayTitle,
				defaultChartToRender: preferences.defaultChartToRender,
				defaultBarStacking: preferences.defaultBarStacking,
				defaultLanguage: preferences.defaultLanguage,
				defaultTimezone: preferences.defaultTimezone
			});
	}
}

module.exports = Preferences;
