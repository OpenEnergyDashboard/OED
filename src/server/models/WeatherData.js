/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const database = require('./database');

 const sqlFile = database.sqlFile;
 
 class WeatherData {
    /**
     * Constructor without the id sine it's not in the schema
     * @param weather_location_id The weather location id
     * @param start_time The weather data's start_time
     * @param end_time The weather data's end_time
     * @param temperature The actual weather data (temperature)
     */
    constructor(weather_location_id, start_time, end_time, temperature){
        this.weather_location_id = weather_location_id;
        this.start_time = start_time;
        this.end_time = end_time;
        this.temperature = temperature;
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
      * @param conn is the connection to use.
      * @param weather_location_id
      * @param start_time
      * @returns {Promise.<WeatherData>}
      */
    static async getByPrimaryKey(weather_location_id, start_time, conn) {
        const row = await conn.one(sqlFile('weather_data/get_weather_data_by_id_and_start_time.sql'), { weather_location_id: weather_location_id, start_time: start_time});
        return new WeatherData(row.weather_location_id, row.start_time, row.end_time, row.temperature);
    }

    /**
     * Returns a promise to get the latest end timestamp from all weather data.
     * @param conn the database connection to use
     * @returns {Promise<Moment>} the latest end timestamp as a Moment object
     */
    static async getLatestTimeStamp(conn) {
      try {
        return moment( await conn.one(sqlFile('weather_data/get_latest_timestamp.sql')));
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
          weather_location_id: this.weather_location_id,
          start_time: this.start_time,
          end_time: this.end_time,
          temperature: this.temperature
      });
  }
    
 }
 
 module.exports = WeatherData;
 