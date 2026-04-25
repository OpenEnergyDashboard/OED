/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class HolidayGroupMember {
    /**
	 * @param holidayInstanceGroupId id of HolidayInstanceGroup
	 * @param holidayInstanceId id of HolidayInstance
	 */
    constructor(holidayInstanceGroupId, holidayInstanceId) {
		this.holidayInstanceGroupId = holidayInstanceGroupId;
		this.holidayInstanceId = holidayInstanceId;
	}

    /**
	 * Returns a promise to create the holiday_group_members table
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('holidayGroupMember/create_holiday_group_members_table.sql'));
	}

    /**
	 * Returns a promise to get holidayGroup memeber and associated holiday instances, holidays, and day patterns with given holidayInstanceGroupId
	 * @param conn is the connection to use.
     * @param holidayInstanceGroupId
	 * @returns FIXME: FIGURE OUT WHAT THIS RETURNS
	 */
	static async getByGroupId(holidayInstanceGroupId, conn) {
		const rows = await conn.any(sqlFile('holidayGroupMember/get_by_group_id.sql'), { holidayInstanceGroupId: holidayInstanceGroupId });
		return rows;
	}

    /**
	 * Returns a promise to get holiday dates associated with given holidayInstanceGroupId
	 * @param conn is the connection to use.
     * @param holidayInstanceGroupId
	 * @returns FIXME: FIGURE OUT WHAT THIS RETURNS
	 */
	static async getHolidayDatesByGroupId(holidayInstanceGroupId, conn) {
		const rows = await conn.any(sqlFile('holidayGroupMember/get_holiday_dates_by_group_id.sql'), { holidayInstanceGroupId: holidayInstanceGroupId });
		return rows;
	}

    /**
	 * Returns a promise to insert this holidayGroupMember into the database
	 * @param conn is the connection to use.
	 * @returns {Promise.<>}
	 */
	async insert(conn) {
		const holidayGroupMember = this;
		return await conn.none(sqlFile('holidayGroupMember/insert_new_holiday_group_member.sql'), holidayGroupMember);
	}

    /**
	 * Returns a promise to delete holidayGroupMembers with given holidayInstanceGroupId
	 * @param holidayInstanceGroupId id of holidayInstanceGroup
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteByGroupId(holidayInstanceGroupId, conn) {
		return conn.none(sqlFile('holidayGroupMember/delete_by_group_id.sql'), { holidayInstanceGroupId: holidayInstanceGroupId });
	}

    /**
	 * Returns a promise to delete holidayGroupMembers with given holidayInstanceGroupId and holidayInstanceId
	 * @param holidayInstanceGroupId id of holidayInstanceGroup
     * @param holidayInstanceId id of holidayInstance
	 * @param conn is the connection to use.
	 * @returns {Promise<void>}
	 */
	static deleteHolidayGroupMember(holidayInstanceGroupId, holidayInstanceId, conn) {
		return conn.none(sqlFile('holidayGroupMember/delete_holiday_group_member.sql'), { holidayInstanceGroupId: holidayInstanceGroupId, holidayInstanceId: holidayInstanceId });
	}
}

module.exports = HolidayGroupMember;