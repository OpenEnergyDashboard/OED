/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const database = require('./database');
const sqlFile = database.sqlFile;

class Day {
	/**
	 * @param {*} id This day patterns' id.
	 * @param {*} name This day pattern's name.
	 * @param {*} note Comments by the admin.
	 */
	constructor(id, name, note) {
		this.id = id;
		this.name = name;
		this.note = note;
	}

	/**
	 * Returns a promise to create the day patterns table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('day/create_day_patterns_table.sql'));
	}

	/**
	 * Create a new Day object from the row's data.
	 * @param {*} row The row from which Day will be created.
	 * @returns the created Day object.
	 */
	static mapRow(row) {
		return new Day(
			row.id,
			row.name,
			row.note
		);
	}

	/**
	 * Get all Day objects
	 * @param {*} conn The database connection to use.
	 * @returns all Day objects.
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('day/get_all.sql'));
		return rows.map(Day.mapRow);
	}

	/** 
	 * Get the day associated the id. If the day doesn't exist then return null.
	 * @param {*} id The day id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Day>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('day/get_by_id.sql'), {
			id: id
		});
		return Day.mapRow(row);
	}

	/**
	 * Insert new day into the database along with a default day segment.
	 * The default day segment spans from 0 to 24.
	 * Sets the day segments day_id property to the id of the newly created day.
	 * @param {*} slope The slope of the day segment
	 * @param {*} intercept The intercept of the day segment
	 * @param {*} conn The database connection to use.
	 * @returns {Promise.<>}
	 */
	async insert(slope, intercept, segmentNote, conn) {
		const day = this;

		return conn.tx(async t => {
			// insert new day
			const dayData = {
				name: day.name,
				note: day.note
			};
			const resp = await t.one(sqlFile('day/insert_new_day_pattern.sql'), dayData);
			this.id = resp.id;

			// insert default day segment, including the new day id
			const daySegment = {
				dayId: this.id,
				startHour: 0,
				endHour: 24,
				slope: slope,
				intercept: intercept,
				note: segmentNote
			};
			await t.none(sqlFile('daySegment/insert_new_day_segment.sql'), daySegment);
		});
	}

	/**
	 * Returns a promise to update an existing day in the database.
	 * @param {*} conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(conn) {
		const day = this;
		await conn.none(sqlFile('day/update_day_pattern.sql'), day);
	}

	/**
	 * Delete the day associated with the id
	 * @param {*} id The day id.
	 * @param {*} conn The connection to use.
	 */
	static async delete(id, conn) {
		await conn.none(sqlFile('day/delete_day.sql'), {
			id: id
		});
	}
}

module.exports = Day;