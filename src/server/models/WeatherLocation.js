/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const database = require('./database');

 const sqlFile = database.sqlFile;
 
 class WeatherLocation {
     /**
      * @param id This weather location's ID. 
      * @param identifier This weather location's identifier
      * @param longitude The weather locations's longitude
      * @param latitude The weather locations's latitude
      * @param note The weather location's note
      */
     constructor(id, identifier, longitude, latitude, note) {
         this.id = id;
         this.identifier = identifier
         this.longitude = longitude;
         this.latitude = latitude;
         this.note = note;
     }
 
     /**
      * Returns a promise to create the weather locations table
      * @param conn is the connection to use.
      * @returns {Promise.<>}
      */
     static createTable(conn) {
         return conn.none(sqlFile('weather_location/create_weather_location_table.sql'));
     }
 
     /**
      * Returns a promise to retrieve the weather location with the given id from the database.
      * @param conn is the connection to use.
      * @param id
      * @returns {Promise.<WeatherLocation>}
      */
     static async getByID(id, conn) {
         const row = await conn.one(sqlFile('weather_location/get_weather_location_by_id.sql'), { id: id });
         return new WeatherLocation(row.id, row.identifier, row.longitude, row.latitude, row.note);
     }
 
     /**
      * Returns a promise to retrieve the weather location with the given coordinates from the database.
      * @param longitude the longitude to look up
      * @param latitude the latitude to look up
      * @param conn the connection to use.
      * @returns {Promise.<WeatherLocation>} either the weather_location object with info or null if does not exist.
      */
     static async getByCoordinates(longitude, latitude, conn) {
         const row = await conn.oneOrNone(sqlFile('weather_location/get_weather_location_by_coordinates.sql'), { longitude: longitude, latitude : latitude });
         return row === null ? null : new WeatherLocation(row.id, row.identifier, row.longitude, row.latitude, row.note);
     }
 
     /**
      * Returns a promise to get all of the weather locations from the database
      * @param conn is the connection to use.
      * @returns {Promise.<array.<WeatherLocation>>}
      */
     static async getAll(conn) {
         const rows = await conn.any(sqlFile('weather_location/get_all_weather_locations.sql'));
         return rows.map(row => new WeatherLocation(row.id, row.identifier, row.latitude, row.longitude, row.note));
     }
 
     /**
      * Returns a promise to insert this weather location into the database
      * @param conn is the connection to use.
      * @returns {Promise.<>}
      */
     async insert(conn) {
         const weatherLocation = this;
         if (weatherLocation.id !== undefined) {
             throw new Error('Attempted to insert a weatherLocation that already has an ID');
         }
         await conn.none(sqlFile('weather_location/insert_new_weather_location.sql'), weatherLocation);
     }
     
     /**
	 * Returns a promise to update an existing location in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const weatherLocation = this;
		if (weatherLocation.id === undefined) {
			throw new Error('Attempt to update a location with no ID');
		}
		await conn.none(sqlFile('weather_location/update_location.sql'), weatherLocation);
	}


     /**
	 * Returns a promise to delete a weather location
	 * @param id The ID of the weather location to be deleted
	 * @param conn the connection to be used.
	 * @returns {Promise.<void>}
	 */
	static async delete(id, conn) {
		await conn.none(sqlFile('weather_location/delete_weather_location.sql'), { id: id });
	}
 }
 
 module.exports = WeatherLocation;
 