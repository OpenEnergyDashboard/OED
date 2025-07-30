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
	 * @param {*} note Comments by the admin or OED inserted.
	 */
	constructor(sourceId, destinationId, bidirectional, note) {
		this.sourceId = sourceId;
		this.destinationId = destinationId;
		this.bidirectional = bidirectional;
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
		return new Conversion(row.source_id, row.destination_id, row.bidirectional, row.note);
	}

	/**
	 * Get all conversions in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<Conversion>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversion/get_all.sql'));
		return rows.map(Conversion.mapRow);
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
	 * Inserts a new conversion to the database, along with a conversion segment.
	 * The default conversion segment spans from -inf to inf.
	 * @param {*} conn The connection to use.
	 */
	async insert(weekPatternsId, slope, intercept, segmentNote, conn) {
		// insert new conversion
		const conversionData = {
			sourceId: this.sourceId,
			destinationId: this.destinationId,
			bidirectional: this.bidirectional,
			note: this.note
		};

		await conn.none(sqlFile('conversion/insert_new_conversion.sql'), conversionData);

		// insert new conversion segment
		const conversionSegment = {
			sourceId: this.sourceId,
			destinationId: this.destinationId,
			weekPatternsId: weekPatternsId,
			slope: slope,
			intercept: intercept,
			startTime: '-infinity',
			endTime: 'infinity',
			note: segmentNote
		};

		await conn.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), conversionSegment);
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
	static async delete(source, destination, conn) {
		await conn.none(sqlFile('conversion/delete_conversion.sql'), {
			source: source,
			destination: destination
		});
	}
}

module.exports = Conversion;
