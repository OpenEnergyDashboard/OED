/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class Holiday{
    /**
	 * @param id Id of holiday
	 * @param name Name of the holiday
	 * @param startDate The day that a holiday takes place on. If a holiday extends into another day, only this day is used
	 * @param location location set by user
	 * @param note The holiday note
	 */
    constructor(id, name, startDate, location, note = '') {
		this.id = id;
		this.name = name;
		this.startDate = startDate;
		this.location = location;
		this.note = note;
	}

    /**
	 * Returns a promise to create the holidays table
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('holiday/create_holidays_table.sql'));
	}

    /**
	 * Returns a promise to delete a holiday
	 * @param id the id of the holiday
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteHoliday(id, conn) {
		return conn.none(sqlFile('holiday/delete_holiday.sql'), { id: id });
	}

    /**
	 * Returns a promise to get all of the holidays from the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<Holiday>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('holiday/get_all.sql'));
		return rows.map(row => new Holiday(row.id, row.name, row.startDate, row.location, row.note));
	}

    /**
	 * Returns a promise to retrieve the holiday with the given id from the database.
	 * @param conn is the connection to use.
	 * @param id
	 * @returns {Promise.<Holiday>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('holiday/get_by_id.sql'), { id: id });
		return new Holiday(row.id, row.name, row.startDate, row.location, row.note);
	}
    
    /**
	 * Returns a promise to get all of the holidays with the given location from the database
	 * @param conn is the connection to use.
     * @param location
	 * @returns {Promise.<array.<Holiday>>}
	 */
	static async getByLocation(location, conn) {
		const rows = await conn.any(sqlFile('holiday/get_by_location.sql'), { location: location });
		return rows.map(row => new Holiday(row.id, row.name, row.startDate, row.location, row.note));
	}

    /**
	 * Returns id of inserted holiday
	 * @param conn is the connection to use.
	 * @returns id of inserted holiday
	 */
	async insert(conn) {
		const holiday = this;
		if (holiday.id !== undefined) {
			throw new Error('Attempted to insert a holiday that already has an ID');
		}
		return await conn.none(sqlFile('holiday/insert_new_holiday.sql'), holiday);
	}

    /**
	 * Returns a promise to update a holiday
	 * @param id the id of the holiday to be updated
	 * @param name the new name
	 * @param startDate the new start date
     * @param location the new location
	 * @param note the new note
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static async updateHoliday(id, name, startDate, location, note, conn) {
		return conn.none(sqlFile('holiday/update_holiday.sql'), { id: id, name: name, startDate: startDate, location: location, note: note });
	}
}

module.exports = Holiday;