/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const database = require('./database');

const getDB = database.getDB;
const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultChartToRender - Chart to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 * @param {String} defaultLanguage - Option to set the default language
	 */
	constructor(displayTitle, defaultChartToRender, defaultBarStacking, defaultLanguage) {
		this.displayTitle = displayTitle;
		this.defaultChartToRender = defaultChartToRender;
		this.defaultBarStacking = defaultBarStacking;
		this.defaultLanguage = defaultLanguage;
	}

	/**
	 * Returns a promise to create the preferences table and associated enums
	 * @returns {Promise.<>}
	 */
	static async createTable() {
		await getDB().none(sqlFile('preferences/create_graph_types_enum.sql'));
		await getDB().none(sqlFile('preferences/create_language_types_enum.sql'));
		await getDB().none(sqlFile('preferences/create_preferences_table.sql'));
		await getDB().none(sqlFile('preferences/insert_default_row.sql'));
	}

	static mapRow(row) {
		return new Preferences(row.display_title, row.default_chart_to_render, row.default_bar_stacking, row.default_language);
	}

	static async get() {
		const row = await getDB().one(sqlFile('preferences/get_preferences.sql'));
		return Preferences.mapRow(row);
	}

	static async update(newPreferences) {
		const preferences = await Preferences.get();
		_.merge(preferences, newPreferences);
		await getDB().none(sqlFile('preferences/update_preferences.sql'),
			{
				displayTitle: preferences.displayTitle,
				defaultChartToRender: preferences.defaultChartToRender,
				defaultBarStacking: preferences.defaultBarStacking,
				defaultLanguage: preferences.defaultLanguage
			});
	}
}

module.exports = Preferences;
