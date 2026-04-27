/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class HolidayInstance {
    /**
	 * @param id Id of holidayInstance
	 * @param name Name of the holidayInstance
	 * @param note The holidayInstance note
     * @param holidayId id of holiday that instance is an instance of
	 * @param dayPatternId id of day pattern holidayInstance follows
	 */
    constructor(id, name, holidayId, dayPatternId, note = '') {
		this.id = id;
		this.name = name;
		this.holidayId = holidayId;
		this.dayPatternId = dayPatternId;
		this.note = note;
	}

    /**
	 * Returns a promise to create the holidayInstance table
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('holidayInstance/create_holiday_instance_table.sql'));
	}

    /**
	 * Returns a promise to get all of the holidayInstances from the database, ordered by name
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<HolidayInstance>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('holidayInstance/get_all.sql'));
		return rows.map(row => new HolidayInstance(row.id, row.name, row.holiday_id, row.day_pattern_id, row.note));
	}

    /**
	 * Returns a promise to get all of the holidayInstances with the given holidayId from the database, ordered by name
	 * @param conn is the connection to use.
     * @param holidayId
	 * @returns {Promise.<array.<HolidayInstance>>}
	 */
	static async getByHolidayId(holidayId, conn) {
		const rows = await conn.any(sqlFile('holidayInstance/get_by_holiday_id.sql'), { holidayId: holidayId });
		return rows.map(row => new HolidayInstance(row.id, row.name, row.holiday_id, row.day_pattern_id, row.note));
	}

    /**
	 * Returns a promise to retrieve the holidayInstance with the given id from the database, ordered by name
	 * @param conn is the connection to use.
     * @param id
	 * @returns {Promise.<HolidayInstance>}
	 */
	static async getById(id, conn) {
		const rows = await conn.any(sqlFile('holidayInstance/get_by_id.sql'), { id: id });
		return rows.map(row => new HolidayInstance(row.id, row.name, row.holiday_id, row.day_pattern_id, row.note));
	}

    /**
	 * Returns a promise to get all holidayInstances with associated holidays and day patterns
	 * @param conn is the connection to use.
	 * @returns FIXME: FIGURE OUT WHAT THIS RETURNS
	 */
	static async getWithDetails(conn) {
		const rows = await conn.any(sqlFile('holidayInstance/get_with_details.sql'));
		return rows;
	}

    /**
	 * Returns id of inserted holidayInstance
	 * @param conn is the connection to use.
	 * @returns id of inserted holidayInstance
	 */
	async insert(conn) {
		const holidayInstance = this;
		if (holidayInstance.id !== undefined) {
			throw new Error('Attempted to insert a holidayInstance that already has an ID');
		}
		return await conn.none(sqlFile('holidayInstance/insert_new_holiday_instance.sql'), holidayInstance);
	}

    /**
	 * Returns a promise to update a holidayInstance
	 * @param id the id of the holiday to be updated
	 * @param name the new name
	 * @param holidayId the new holidayId
     * @param dayPatternId the new dayPatternId
	 * @param note the new note
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static async updateHoliday(id, name, holidayId, dayPatternId, note, conn) {
		return conn.none(sqlFile('holidayInstance/update_holiday_instance.sql'), { id: id, name: name, holidayId: holidayId, dayPatternId: dayPatternId, note: note });
	}

    /**
	 * Returns a promise to delete a holidayInstance
	 * @param id the id of the holidayInstance
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteHolidayInstance(id, conn) {
		return conn.none(sqlFile('holidayInstance/delete_holiday_instance.sql'), { id: id });
	}
}

module.exports = HolidayInstance;
