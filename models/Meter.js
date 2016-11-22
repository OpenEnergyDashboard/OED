const db = require('./database');
const Reading = require('./Reading');

class Meter {
	/**
	 * @param id This meter's ID. Should be undefined if the meter is being newly created
	 * @param name This meter's name
	 * @param ipAddress This meter's IP Address
	 */
	constructor(id, name, ipAddress) {
		this.id = id;
		this.name = name;
		this.ipAddress = ipAddress;
	}

	/**
	 * Returns a promise to retrieve the meter with the given name from the database.
	 * @param name
	 * @returns {Promise.<Meter>}
	 */
	static getByName(name) {
		return db.one('SELECT id, name, ipaddress FROM meters WHERE name=${name}', { name: name })
			.then(row => new Meter(row.id, row.name, row.ipaddress));
	}

	/**
	 * Returns a promise to get all of the meters from the database
	 * @returns {Promise.<array.<Meter>>}
	 */
	static getAll() {
		return db.any('SELECT * FROM meters')
			.then(rows => rows.map(row => new Meter(row.id, row.name, row.ipaddress)));
	}

	/**
	 * Returns a promise to insert this meter into the database
	 * @returns {Promise.<>}
	 */
	insert() {
		const meter = this;
		return new Promise((resolve, reject) => {
			if (this.id !== undefined) {
				reject(Error('Attempt to insert a meter that already has an ID'));
			} else {
				resolve(meter);
			}
		})
			.then(m => db.none('INSERT INTO meters(name, ipaddress) VALUES (${name}, ${ipAddress})', m));
	}

	/**
	 * Returns a promise to get all of the readings for this meter from the database.
	 * @returns {Promise.<Array.<Reading>>}
	 */
	readings() {
		return Reading.getAllByMeterID(this.id);
	}
}

module.exports = Meter;
