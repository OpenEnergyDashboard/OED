/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const database = require('./database');
 const sqlFile = database.sqlFile;
 
 class Location {
     /**
      * @param {*} id This location's ID.
      * @param {*} identifier A unique identifier for the location.
      * @param {*} gps A POINT (longitude, latitude) representing the location's GPS coordinates.
      * @param {*} note Additional notes about the location.
      */
     constructor(id, identifier, gps, note) {
         this.id = id;
         this.identifier = identifier;
         this.gps = gps;
         this.note = note;
     }
 
     /**
      * Maps a row from the database to a Location object.
      * @param {*} row 
      * @returns {Location}
      */
     static mapRow(row) {
         return new Location(row.id, row.identifier, row.gps, row.note);
     }
 
     /**
      * Creates the weather_location table.
      * @param {*} conn The connection to use.
      * @returns {Promise<>}
      */
     static createTable(conn) {
         return conn.none(sqlFile('location/create_location_table.sql'));
     }
 
     /**
      * Gets all locations from the database.
      * @param {*} conn The connection to use.
      * @returns {Promise<Array<Location>>}
      */
     static async getAll(conn) {
         const rows = await conn.any(sqlFile('location/get_all_locations.sql'));
         return rows.map(Location.mapRow);
     }
 
     /**
      * Gets a location by ID.
      * @param {*} id 
      * @param {*} conn 
      * @returns {Promise<Location>}
      */
     static async getById(id, conn) {
         const row = await conn.one(sqlFile('location/get_by_id.sql'), { id });
         return Location.mapRow(row);
     }
 
     /**
      * Gets a location by identifier.
      * @param {*} identifier 
      * @param {*} conn 
      * @returns {Promise<Location>}
      */
     static async getByIdentifier(identifier, conn) {
         const row = await conn.oneOrNone(sqlFile('location/get_by_identifier.sql'), { identifier });
         return row ? Location.mapRow(row) : null;
     }
 
     /**
      * Inserts a new location.
      * @param {*} conn 
      * @returns {Promise<void>}
      */
     async insert(conn) {
         if (this.id !== undefined) {
             throw new Error('Attempt to insert a location that already has an ID');
         }
         const resp = await conn.one(sqlFile('location/insert_location.sql'), this);
         this.id = resp.id;
     }
 
     /**
      * Updates an existing location.
      * @param {*} conn 
      * @returns {Promise<void>}
      */
     async update(conn) {
         if (this.id === undefined) {
             throw new Error('Attempt to update a location with no ID');
         }
         await conn.none(sqlFile('location/update_location.sql'), this);
     }
 
     /**
      * Deletes a location.
      * @param {*} id 
      * @param {*} conn 
      * @returns {Promise<void>}
      */
     static async delete(id, conn) {
         await conn.none(sqlFile('location/delete_location.sql'), { id });
     }
 }
 
 module.exports = Location;
 