/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');

const db = database.db;
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
		return db.none(sqlFile('meter/create_meters_table.sql'));
	}

	/**
	 * Returns a promise to create the meter_type type.
	 * This needs to be run before Meter.createTable().
	 * @return {Promise<void>}
	 */
	static createMeterTypesEnum() {
		return db.none(sqlFile('meter/create_meter_types_enum.sql'));
	}
}

module.exports = Meter;
