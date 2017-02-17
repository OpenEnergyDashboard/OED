const database = require('./database');
const Reading = require('./Reading');

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

	/**
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name the meter's name
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Meter>}
	 */
	static async getByName(name, conn = db) {
		const row = await conn.one(sqlFile('meter/get_meter_by_name.sql'), { name: name });
		return Meter.mapRow(row);
	}

	static mapRow(row) {
		return new Meter(row.id, row.name, row.ipaddress, row.enabled, row.meter_type);
	}
	/**
	 * Returns a promise to retrieve the meter with the given id from the database.
	 * @param id
 	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Meter>}
	 */
	static async getByID(id, conn = db) {
		const row = await conn.one(sqlFile('meter/get_meter_by_id.sql'), { id: id });
		return Meter.mapRow(row);
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<array.<Meter>>}
	 */
	static async getAll(conn = db) {
		const rows = await conn.any(sqlFile('meter/get_all_meters.sql'));
		return rows.map(Meter.mapRow);
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<>}
	 */
	async insert(conn = db) {
		const meter = this;
		if (meter.id !== undefined) {
			throw new Error('Attempt to insert a meter that already has an ID');
		}
		await conn.none(sqlFile('meter/insert_new_meter.sql'), meter);
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @param conn the connection to use. Defaults to the default database connection.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings(conn = db) {
		return Reading.getAllByMeterID(this.id, conn);
	}
}

Meter.type = {
	MAMAC: 'mamac',
	METASYS: 'metasys'
};

module.exports = Meter;
