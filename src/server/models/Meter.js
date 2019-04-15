/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const Reading = require('./Reading');

const getDB = database.getDB;
const sqlFile = database.sqlFile;

class Meter {
	/**
	 * @param id This meter's ID. Should be undefined if the meter is being newly created
	 * @param name This meter's name
	 * @param ipAddress This meter's IP Address
	 * @param enabled This meter is being actively read from
	 * @param type What kind of meter this is
	 */
	constructor(id, name, ipAddress, enabled, type) {
		this.id = id;
		this.name = name;
		this.ipAddress = ipAddress;
		this.enabled = enabled;
		this.type = type;
	}

	/**
	 * Returns a promise to create the meters table.
	 * @return {Promise.<>}
	 */
	static createTable() {
		return getDB().none(sqlFile('meter/create_meters_table.sql'));
	}

	/**
	 * Returns a promise to create the meter_type type.
	 * This needs to be run before Meter.createTable().
	 * @return {Promise<void>}
	 */
	static createMeterTypesEnum() {
		return getDB().none(sqlFile('meter/create_meter_types_enum.sql'));
	}

	/**
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name the meter's name
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Meter>}
	 */
	static async getByName(name, conn = getDB) {
		const row = await conn().one(sqlFile('meter/get_meter_by_name.sql'), { name: name });
		return Meter.mapRow(row);
	}

	/**
	 * Check if a meter with the same name is already in the database.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {boolean}
	 */
	async existsByName(conn = getDB) {
		const row = await conn().oneOrNone(sqlFile('meter/get_meter_by_name.sql'), { name: this.name });
		return row !== null;
	}

	/**
	 * Creates a new meter from the data in a row.
	 * @param row the row from which the meter is to be created
	 * @returns {Meter}
	 */
	static mapRow(row) {
		return new Meter(row.id, row.name, row.ipaddress, row.enabled, row.meter_type);
	}

	/**
	 * Returns a promise to retrieve the meter with the given id from the database.
	 * @param id the id of the meter to retrieve
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Meter>}
	 */
	static async getByID(id, conn = getDB) {
		const row = await conn().one(sqlFile('meter/get_meter_by_id.sql'), { id: id });
		return Meter.mapRow(row);
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getAll(conn = getDB) {
		const rows = await conn().any(sqlFile('meter/get_all_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	async insert(conn = getDB) {
		const meter = this;
		if (meter.id !== undefined) {
			throw new Error('Attempt to insert a meter that already has an ID');
		}
		const resp = await conn().one(sqlFile('meter/insert_new_meter.sql'), meter);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings(conn = getDB) {
		return Reading.getAllByMeterID(this.id, conn);
	}
}

// Enum of meter types
Meter.type = {
	MAMAC: 'mamac',
	METASYS: 'metasys'
};

module.exports = Meter;
