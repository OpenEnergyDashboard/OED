/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const merge = require('lodash/merge');
const database = require('./database');

const sqlFile = database.sqlFile;

class Preferences {
	/**
	 * @param {String} displayTitle - Header title to display
	 * @param {String} defaultChartToRender - Chart to display as default
	 * @param {Boolean} defaultBarStacking - Option to set default toggle of bar stacking
	 * @param {String} defaultLanguage - Option to set the default language
	 * @param {String} defaultTimezone - Option to set the default timezone
	 * @param {Number} defaultWarningFileSize - Option to set the default warning file size
	 * @param {Number} defaultFileSizeLimit - Option to set the default file size limit
	 * @param {Number} defaultAreaNormalization - Option to set the default toggle of area normalization
	 * @param {String} defaultAreaUnit - The default area unit to normalize by
	 * @param {String} defaultMeterReadingFrequency - The default meter reading frequency if none is given
	 * @param {Number} defaultMeterMinimumValue - Option to set the default meter minimum value
	 * @param {Number} defaultMeterMaximumValue - Option to set the default meter maximum value
	 * @param {String} defaultMeterMinimumDate - Option to set the default meter minimum date
	 * @param {String} defaultMeterMaximumValue - Option to set the default meter maximum value
	 * @param {Number} defaultMeterReadingGap - Option to set the default meter reading gap
	 * @param {Number} defaultMeterMaximumErrors - Option to set the default meter maximum number of errors
	 * @param {Boolean} defaultMeterDisableChecks - Option to set the default meter disable checks
	 * @param {String} defaultHelpUrl - Option to set the default help page url
	*/
	constructor(displayTitle, defaultChartToRender, defaultBarStacking, defaultLanguage, defaultTimezone,
		defaultWarningFileSize, defaultFileSizeLimit, defaultAreaNormalization, defaultAreaUnit, defaultMeterReadingFrequency,
		defaultMeterMinimumValue, defaultMeterMaximumValue, defaultMeterMinimumDate,
		defaultMeterMaximumDate, defaultMeterReadingGap, defaultMeterMaximumErrors, defaultMeterDisableChecks, defaultHelpUrl) {
		this.displayTitle = displayTitle;
		this.defaultChartToRender = defaultChartToRender;
		this.defaultBarStacking = defaultBarStacking;
		this.defaultLanguage = defaultLanguage;
		this.defaultTimezone = defaultTimezone;
		this.defaultWarningFileSize = defaultWarningFileSize;
		this.defaultFileSizeLimit = defaultFileSizeLimit;
		this.defaultAreaNormalization = defaultAreaNormalization;
		this.defaultAreaUnit = defaultAreaUnit;
		this.defaultMeterReadingFrequency = defaultMeterReadingFrequency;
		this.defaultMeterMinimumValue = defaultMeterMinimumValue;
		this.defaultMeterMaximumValue = defaultMeterMaximumValue;
		this.defaultMeterMinimumDate = defaultMeterMinimumDate;
		this.defaultMeterMaximumDate = defaultMeterMaximumDate;
		this.defaultMeterReadingGap = defaultMeterReadingGap;
		this.defaultMeterMaximumErrors = defaultMeterMaximumErrors;
		this.defaultMeterDisableChecks = defaultMeterDisableChecks;
		this.defaultHelpUrl = defaultHelpUrl;
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
		return new Preferences(
			row.display_title,
			row.default_chart_to_render,
			row.default_bar_stacking,
			row.default_language,
			row.default_timezone,
			row.default_warning_file_size,
			row.default_file_size_limit,
			row.default_area_normalization,
			row.default_area_unit,
			row.default_meter_reading_frequency,
			row.default_meter_minimum_value,
			row.default_meter_maximum_value,
			row.default_meter_minimum_date,
			row.default_meter_maximum_date,
			row.default_meter_reading_gap,
			row.default_meter_maximum_errors,
			row.default_meter_disable_checks,
			row.default_help_url
		);
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
		merge(preferences, newPreferences);

		await conn.none(sqlFile('preferences/update_preferences.sql'),
			{
				displayTitle: preferences.displayTitle,
				defaultChartToRender: preferences.defaultChartToRender,
				defaultBarStacking: preferences.defaultBarStacking,
				defaultLanguage: preferences.defaultLanguage,
				defaultTimezone: preferences.defaultTimezone,
				defaultWarningFileSize: preferences.defaultWarningFileSize,
				defaultFileSizeLimit: preferences.defaultFileSizeLimit,
				defaultAreaNormalization: preferences.defaultAreaNormalization,
				defaultAreaUnit: preferences.defaultAreaUnit,
				defaultMeterReadingFrequency: preferences.defaultMeterReadingFrequency,
				defaultMeterMinimumValue: preferences.defaultMeterMinimumValue,
				defaultMeterMaximumValue: preferences.defaultMeterMaximumValue,
				defaultMeterMinimumDate: preferences.defaultMeterMinimumDate,
				defaultMeterMaximumDate: preferences.defaultMeterMaximumDate,
				defaultMeterReadingGap: preferences.defaultMeterReadingGap,
				defaultMeterMaximumErrors: preferences.defaultMeterMaximumErrors,
				defaultMeterDisableChecks: preferences.defaultMeterDisableChecks,
				defaultHelpUrl: preferences.defaultHelpUrl
			});
		// Postgres interprets the defaultMeterReadingFrequency and it might not be what was
		// input so return the new preferences. Easier just to return them all and only
		// use value needed.
		return this.get(conn);
	}
}

module.exports = Preferences;
