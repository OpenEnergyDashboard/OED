/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const { log } = require('../log');
const moment = require('moment');

const sqlFile = database.sqlFile;

class WeatherData {
	/**
	 * Constructor without the id since it's not in the schema
	 * @param weatherLocationId The weather location id
	 * @param {Moment} startTime The weather data's startTime
	 * @param {Moment} endTime The weather data's endTime
	 * @param temperature The actual weather data (temperature)
	 */
	constructor(weatherLocationId, startTime, endTime, temperature) {
		this.weatherLocationId = weatherLocationId;
		this.startTime = startTime;
		this.endTime = endTime;
		this.temperature = temperature;
	}

	/**
	 * Creates a new WeatherData from the data in a row.
	 * @param {*} row The row from which the WeatherData is to be created.
	 * @returns The new WeatherData object.
	 */
	static mapRow(row) {
		return new WeatherData(row.weatherLocationId, row.startTime, row.endTime, row.temperature);
	}

	/**
	  * Returns a promise to create the weather data table
	  * @param conn is the connection to use.
	  * @returns {Promise.<>}
	  */
	static createTable(conn) {
		return conn.none(sqlFile('weather_data/create_weather_data_table.sql'));
	}

	/**
	  * Returns a promise to retrieve the weather data by the primary key
	  * @param {*} conn The connection to use.
	  * @returns {Promise.<WeatherData>}
	  */
	// TODO: needs model and db get_weather_data
	static async getWeatherData(id, startTime, endTime, conn) {
		const rows = await conn.many(sqlFile('weather_data/get_weather_data_by_id_and_date_range.sql'), {
			weatherLocationId: id,
			startTime: startTime,
			endTime: endTime
		});
		return rows.map(WeatherData.mapRow);
	}

	/**
	 * Returns a promise to get the latest end timestamp for a given weather data location.
	 * @param id is the weather loction's id
	 * @param conn the database connection to use
	 * @returns {Promise<Moment>} the latest end timestamp as a Moment object
	 */
	static async getLatestTimeStamp(id, conn) {
		try {
			return moment(await conn.one(sqlFile('weather_data/get_latest_timestamp.sql'), { weatherLocationId: id }));
		} catch (err) {
			log.error(`Error fetching the latest end timestamp: ${err}`, err);
			throw err;
		}
	}

	/**
	  * Returns a promise to insert this weather data entry into the database
	  * @param conn is the connection to use.
	  * @returns {Promise.<>}
	  */
	async insert(conn) {
		return await conn.none(sqlFile('weather_data/insert_new_weather_data.sql'), {
			weatherLocationId: this.weatherLocationId,
			startTime: this.startTime,
			endTime: this.endTime,
			temperature: this.temperature
		});
	}

}

module.exports = WeatherData;
