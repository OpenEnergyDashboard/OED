/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('lodash');
const database = require('./database');

const db = database.db;
const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultChartToRender - Chart to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 */
	constructor(displayTitle, defaultChartToRender, defaultBarStacking) {
		this.displayTitle = displayTitle;
		this.defaultChartToRender = defaultChartToRender;
		this.defaultBarStacking = defaultBarStacking;
	}

	/**
	 * Returns a promise to create the preferences table
	 * @returns {Promise.<>}
	 */
	static async createTable() {
		await db.none(sqlFile('preferences/create_preferences_table.sql'));
		await db.none(sqlFile('preferences/insert_default_row.sql'));
	}

	/**
	 * Returns a promise to create the graph_type type.
	 * This needs to be run before Preferences.createTable().
	 * @return {Promise<void>}
	 */
	static createGraphTypesEnum() {
		return db.none(sqlFile('preferences/create_graph_types_enum.sql'));
	}

	static mapRow(row) {
		return new Preferences(row.display_title, row.default_chart_to_render, row.default_bar_stacking);
	}

	static async get() {
		const row = await db.one(sqlFile('preferences/get_preferences.sql'));
		return Preferences.mapRow(row);
	}

	static async update(newPreferences) {
		const preferences = await Preferences.get();
		_.merge(preferences, newPreferences);
		await db.none(sqlFile('preferences/update_preferences.sql'),
			{
				displayTitle: preferences.displayTitle,
				defaultChartToRender: preferences.defaultChartToRender,
				defaultBarStacking: preferences.defaultBarStacking
			});
	}
}

module.exports = Preferences;
