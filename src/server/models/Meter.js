/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const Reading = require('./Reading');

const sqlFile = database.sqlFile;

class Meter {
	/**
	 * @param id This meter's ID. Should be undefined if the meter is being newly created
	 * @param name This meter's name
	 * @param ipAddress This meter's IP Address
	 * @param enabled This meter is being actively read from
	 * @param displayable This meters is available to users for charting
	 * @param type What kind of meter this is
	 */
	constructor(id, name, ipAddress, enabled, displayable, type) {
		this.id = id;
		this.name = name;
		this.ipAddress = ipAddress;
		this.enabled = enabled;
		this.displayable = displayable;
		this.type = type;
	}

	/**
	 * Returns a promise to create the meters table.
	 * @param conn the connection to use
	 * @return {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('meter/create_meters_table.sql'));
	}

	/**
	 * Returns a promise to create the meter_type type.
	 * This needs to be run before Meter.createTable().
	 * @param conn the connection to use
	 * @return {Promise<void>}
	 */
	static createMeterTypesEnum(conn) {
		return conn.none(sqlFile('meter/create_meter_types_enum.sql'));
	}

	/**
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name the meter's name
	 * @param conn the connection to be used.
	 * @returns {Promise.<Meter>}
	 */
	static async getByName(name, conn ) {
		const row = await conn.one(sqlFile('meter/get_meter_by_name.sql'), { name: name });
		return Meter.mapRow(row);
	}

	/**
	 * Check if a meter with the same name is already in the database.
	 * @param conn the connection to be used.
	 * @returns {boolean}
	 */
	async existsByName(conn) {
		const row = await conn.oneOrNone(sqlFile('meter/get_meter_by_name.sql'), { name: this.name });
		return row !== null;
	}

	static mapRow(row) {
		return new Meter(row.id, row.name, row.ipaddress, row.enabled, row.displayable, row.meter_type);
	}

	/**
	 * Returns a promise to retrieve the meter with the given id from the database.
	 * @param id the id of the meter to retrieve
	 * @param conn the connection to be used.
	 * @returns {Promise.<Meter>}
	 */
	static async getByID(id, conn) {
		const row = await conn.one(sqlFile('meter/get_meter_by_id.sql'), { id: id });
		return Meter.mapRow(row);
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('meter/get_all_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to get all of the displayable meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getDisplayable(conn) {
		const rows = await conn.any(sqlFile('meter/get_displayable_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to get all of the updatable meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getEnabled(conn) {
		const rows = await conn.any(sqlFile('meter/get_enabled_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @param conn the connection to be used.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const meter = this;
		if (meter.id !== undefined) {
			throw new Error('Attempt to insert a meter that already has an ID');
		}
		const resp = await conn.one(sqlFile('meter/insert_new_meter.sql'), meter);
		this.id = resp.id;
	}

	/**
	 * Returns a promise to update an existing meter in the database
	 * @param conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const meter = this;
		if (meter.id === undefined) {
			throw new Error('Attempt to update a meter with no ID');
		}
		await conn.none(sqlFile('meter/update_meter.sql'), meter);
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param conn the connection to be used.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings(conn) {
		return Reading.getAllByMeterID(this.id, conn);
	}
}

Meter.type = {
	MAMAC: 'mamac',
	METASYS: 'metasys'
};

module.exports = Meter;
