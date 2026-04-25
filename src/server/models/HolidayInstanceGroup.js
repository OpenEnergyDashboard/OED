/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class HolidayInstanceGroup {
    /**
	 * @param id Id of holidayInstanceGroup
	 * @param name Name of the holidayInstanceGroup
	 * @param note The holidayInstanceGroup note
	 */
    constructor(id, name, note = '') {
		this.id = id;
		this.name = name;
		this.note = note;
	}

    /**
	 * Returns a promise to create the holidayInstanceGroup table
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('holidayInstanceGroup/create_holiday_instance_group_table.sql'));
	}

    /**
	 * Returns a promise to get all of the holidayInstanceGroups from the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<array.<HolidayInstanceGroup>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('holidayInstanceGroup/get_all.sql'));
		return rows.map(row => new HolidayInstanceGroup(row.id, row.name, row.note));
	}

    /**
	 * Returns a promise to retrieve the holidayInstanceGroup with the given id from the database.
	 * @param conn is the connection to use.
	 * @param id
	 * @returns {Promise.<HolidayInstanceGroup>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('holidayInstanceGroup/get_by_id.sql'), { id: id });
		return new HolidayInstanceGroup(row.id, row.name, row.note);
	}

    /**
	 * Returns id of inserted holidayInstanceGroup
	 * @param conn is the connection to use.
	 * @returns id of inserted holidayInstanceGroup
	 */
	async insert(conn) {
		const holidayInstanceGroup = this;
		return await conn.none(sqlFile('holidayInstanceGroup/insert_new_holiday_instance_group.sql'), holidayInstanceGroup);
	}

    /**
	 * Returns a promise to update a holiday
	 * @param id the id of the holiday to be updated
	 * @param name the new name
	 * @param note the new note
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static async updateHolidayInstanceGroup(id, name, note, conn) {
		return conn.none(sqlFile('holidayInstanceGroup/update_holiday_instance_group.sql'), { id: id, name: name, note: note });
	}

    /**
	 * Returns a promise to delete a holidayInstanceGroup
	 * @param id the id of the holidayInstanceGroup
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteHolidayInstanceGroup(id, conn) {
		return conn.none(sqlFile('holidayInstanceGroup/delete_holiday_instance_group.sql'), { id: id });
	}
}

module.exports = HolidayInstanceGroup;