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
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name
	 * @returns {Promise.<Meter>}
	 */
	static getByName(name) {
		return db.one(sqlFile('meter/get_meter_by_name.sql'), { name: name })
			.then(Meter.mapRow);
	}

	static mapRow(row) {
		return new Meter(row.id, row.name, row.ipaddress, row.enabled, row.meter_type);
	}
	/**
	 * Returns a promise to retrieve the meter with the given id from the database.
	 * @param id
	 * @returns {Promise.<Meter>}
	 */
	static getByID(id) {
		return db.one(sqlFile('meter/get_meter_by_id.sql'), { id: id })
			.then(Meter.mapRow);
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @returns {Promise.<array.<Meter>>}
	 */
	static getAll() {
		return db.any(sqlFile('meter/get_all_meters.sql'))
			.then(rows => rows.map(Meter.mapRow));
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @returns {Promise.<>}
	 */
	insert() {
		const meter = this;
		return new Promise((resolve, reject) => {
			if (meter.id !== undefined) {
				reject(Error('Attempt to insert a meter that already has an ID'));
			} else {
				resolve(meter);
			}
		}).then(m => db.none(sqlFile('meter/insert_new_meter.sql'), m));
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings() {
		return Reading.getAllByMeterID(this.id);
	}
}

Meter.type = {
	MAMAC: 'mamac',
	METASYS: 'metasys'
};

module.exports = Meter;
