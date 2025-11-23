/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;

class ConversionSegment {
    /**
     * @param {*} sourceId The unit id of the source.
     * @param {*} destinationId The unit id of the destination.
     * @param {*} weekPatternsId The foreign key to the week_patterns if a pre-existing pattern is selected.
     * @param {*} slope The slope of the conversion.
     * @param {*} intercept The intercept of the conversion.
     * @param {*} startTime The hour the segment starts.
     * @param {*} endTime The hour the segment ends.
     * @param {*} note Comments by the admin or OED inserted.
     */
    constructor(sourceId, destinationId, weekPatternsId, slope, intercept, startTime, endTime, note) {
        this.sourceId = sourceId;
        this.destinationId = destinationId;
        this.weekPatternsId = weekPatternsId;
        this.slope = slope;
        this.intercept = intercept;
        this.startTime = startTime;
        this.endTime = endTime;
        this.note = note;
    }

	/**
	 * Returns a promise to create the conversion_segments table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('conversionSegment/create_conversion_segments_table.sql'));
	}

	/**
	 * Creates a new conversion segment from the row's data.
	 * @param {*} row The row from which the conversion segment will be created.
	 * @returns The new conversion segment object.
	 */
	static mapRow(row) {
		return new ConversionSegment(
			row.source_id, 
			row.destination_id, 
			row.week_patterns_id, 
			row.slope, 
			row.intercept, 
			row.start_time, 
			row.end_time, 
			row.note);
	}

	/**
	 * Get all conversion segments in the database.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<Array.<ConversionSegment>>}
	 */
	static async getAll(conn) {
		const rows = await conn.any(sqlFile('conversionSegment/get_all.sql'));
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Returns the conversion segment associated with source and destination. If the conversion segment doesn't exist then return null.
	 * @param {*} sourceId The source unit id.
	 * @param {*} destinationId The destination unit id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestination(sourceId, destinationId, conn) {
		const row = await conn.one(sqlFile('conversionSegment/get_by_source_destination.sql'), {
			sourceId: sourceId,
			destinationId: destinationId
		});
		return row === null ? null : ConversionSegment.mapRow(row);
	}

	/**
	 * Returns the conversion segment associated with source, destination, and startTime. If the conversion segment doesn't exist then return null.
	 * @param {*} sourceId The source unit id.
	 * @param {*} destinationId The destination unit id.
	 * @param {*} startTime The conversion segment start time
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestinationStart(sourceId, destinationId, start, conn) {
		const row = await conn.one(sqlFile('conversionSegment/get_by_source_destination_start.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: start
		});
		return row === null ? null : ConversionSegment.mapRow(row);
	}

	/**
	 * Inserts a new conversion segment to the database.
	 * @param {*} conn The connection to use.
	 */
	async insert(conn) {
		const conversionSegment = this;
		if (conversionSegment.id !== undefined) {
			throw new Error(`Attempted to insert a conversion segment that already has an ID ${conversionSegment.id}`);
		}
		
		await conn.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Updates an existed conversion segment in the database.
	 * @param {*} conn The connection to use.
	 */
	async update(conn) {
		const conversionSegment = this;
		await conn.none(sqlFile('conversionSegment/update_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Deletes the conversion associated with source, destination, and startTime from the database.
	 * @param {*} source The source unit id.
	 * @param {*} destination The destination unit id.
     * @param {*} startTime The time the segment starts.
	 * @param {*} conn The connection to use.
	 */
	static async delete(sourceId, destinationId, startTime, conn) {
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
            startTime: startTime
		});
	}
}

module.exports = ConversionSegment;