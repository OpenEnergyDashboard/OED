/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class Conversion {
	/**
	 * @param {*} sourceId The unit id of the source.
	 * @param {*} destinationId The unit id of the destination.
	 * @param {*} bidirectional Is this conversion bidirectional?
	 * @param {*} slope The slope of the conversion.
	 * @param {*} intercept The intercept of the conversion.
	 * @param {*} note Comments by the admin or OED inserted.
	 */
	constructor(sourceId, destinationId, bidirectional, slope, intercept, note) {
		this.sourceId = sourceId;
		this.destinationId = destinationId;
		this.bidirectional = bidirectional;
		this.slope = slope;
		this.intercept = intercept;
		this.note = note;
	}

	/**
	 * Returns a promise to create the conversions table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('conversion/create_conversions_table.sql'));
	}

	/**
	 * Creates a new conversion from the row's data.
	 * @param {*} row The row from which the conversion will be created.
	 * @returns The new conversion object.
	 */
	static mapRow(row) {
		return new Conversion(row.source_id, row.destination_id, row.bidirectional, row.slope, row.intercept, row.note);
	}

	/**
	 * Returns the conversion associated with source and destination. If the conversion doesn't exist then return null.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Conversion>}
	 */
	static async getBySourceDestination(source, destination, conn) {
		const row = await conn.oneOrNone(sqlFile('conversion/get_by_source_destination.sql'), {
			source: source,
			destination: destination
		});
		return row === null ? null : Conversion.mapRow(row);
	}

	/**
	 * Inserts a new conversion to the database.
	 * @param {*} conn The connection to use.
	 */
	async insert(conn) {
		const conversion = this;
		await conn.none(sqlFile('conversion/insert_new_conversion.sql'), conversion);
	}

	/**
	 * Updates an existed conversion in the database.
	 * @param {*} conn The connection to use.
	 */
	async update(conn) {
		const conversion = this;
		await conn.none(sqlFile('conversion/update_conversion.sql'), conversion);
	}

	/**
	 * Deletes the conversion associated with source and destination from the database.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
	 * @param {*} conn The connection to use.
	 */
	static async delete(source, destination , conn) {
		await conn.none(sqlFile('conversion/delete_conversion.sql'), {
			source: source,
			destination: destination
		});
	}
}

module.exports = Conversion;