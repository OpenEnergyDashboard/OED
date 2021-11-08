/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;
const Point = require('./Point');

// The size of the map circle if none is specified when mapped.
// This should only apply to historical maps before value was set by default.
const DEFAULT_CIRCLE_SIZE = 0.15;

class Map {
	/**
	 * @param id should be undefined when creating a new map
	 * @param name map's name
	 * @param displayable This map is available to users for charting
	 * @param note notes on the map
	 * @param filename name of file used to upload data
	 * @param modifiedDate last modified date of the map
	 * @param origin {Point} coordinates of (0,0) on map
	 * @param opposite {Point} coordinates of opposite corner from origin
	 * @param mapSource data URL of image of the map
	 * @param northAngle stores angle between map orientation and true north, default 0.0
	 * @param circleSize Stores the fraction of horizontal map
	 */
	constructor(id, name, displayable, note, filename, modifiedDate, origin, opposite, mapSource, northAngle, circleSize) {
		this.id = id;
		this.name = name;
		this.displayable = displayable;
		this.note = note;
		this.filename = filename;
		this.modifiedDate = modifiedDate;
		this.origin = origin;
		this.opposite = opposite;
		this.mapSource = mapSource;
		this.northAngle = northAngle;
		this.circleSize = circleSize;
	}

	/**
	 * Returns a promise to create all the map tables.
	 * @param conn the database connection to use
	 * @returns {Promise<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('map/create_maps_table.sql'));
	}

	/**
	 * Returns a promise to insert this map into the db
	 * @param conn a function returning the connection to be used, defaults to the default database connection.
	 * @return {Promise.<void>}
	 */
	async insert(conn) {
		const map = this;
		if (map.id !== undefined) {
			throw new Error('Attempt to insert a map that already has an ID');
		}
		const resp = await conn.one(sqlFile('map/insert_new_map.sql'), map);
		// resp = { id: 42 }, hence this line
		this.id = resp.id;
	}

	/**
	 * Returns a promise to update an existing map in the database
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const map = this;
		if (map.id === undefined) {
			throw new Error('Attempt to update a map with no ID');
		}
		await conn.none(sqlFile('map/update_map.sql'), map);
	}

	/**
	 * Creates a new map based on the data in a row
	 * @param row field names used to extract from row must match column names inside SQL functions
	 * @returns {Map}
	 */
	static mapRow(row) {
		// checks if max_circle_size_fraction is null because of pre-existing maps where then uses
		// default circle size that should now be set automatically.
		return new Map(row.id, row.name, row.displayable, row.note, row.filename,
			row.modified_date, row.origin, row.opposite, row.map_source, row.north_angle,
			(row.max_circle_size_fraction !== null ? row.max_circle_size_fraction : DEFAULT_CIRCLE_SIZE));
	}

	/**
	 * // not quite relevant at present
	 * Returns a promise to retrieve the map with the given name.
	 * @param name the map's name
	 * @param conn the connection to be used.
	 * @returns {Promise.<Map>}
	 */
	static async getByName(name, conn) {
		const row = await conn.one(sqlFile('map/get_map_by_name.sql'), { name: name });
		return Map.mapRow(row);
	}

	/**
	 * // not quite relevant at present
	 * Returns a promise to retrieve the map with the given id.
	 * @param id the id of the map
	 * @param conn the connection to be used.
	 * @returns {Promise.<Map>}
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('map/get_map_by_id.sql'), { id: id });
		return Map.mapRow(row);
	}

	/**
	 * returns a promise to retrieve all maps in the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<Map>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('map/get_all_maps.sql'));
		return rows.map(Map.mapRow);
	}

	/**
	 * Returns a promise to get all of the displayable maps from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Map>>}
	 */
	static async getDisplayable(conn) {
		const rows = await conn.any(sqlFile('map/get_displayable_maps.sql'));
		return rows.map(Map.mapRow);
	}

	/**
	 * Change the name of this map
	 * @param newName New name for the map
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	async rename(newName, conn) {
		await conn.none(sqlFile('map/rename_map.sql'), { new_name: newName, id: this.id });
	}

	/**
	 * Returns a promise to delete a map
	 * @param mapID The ID of the map to be deleted
	 * @param conn the connection to be used.
	 * @return {Promise.<void>}
	 */
	static async delete(mapID, conn) {
		await conn.none(sqlFile('map/delete_map.sql'), { id: mapID });
	}
}
module.exports = { Map, DEFAULT_CIRCLE_SIZE };
