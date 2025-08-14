/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('./database');
const sqlFile = database.sqlFile;
const { log } = require('../log');
const { momentToIsoOrInfinity } = require('../util/handleTimestampValues');

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
		this.startTime = momentToIsoOrInfinity(startTime);
		this.endTime = momentToIsoOrInfinity(endTime);
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
	 * Creates a new conversion segment from the data in a row.
	 * @param {*} row The row from which the conversion segment will be created.
	 * @returns ConversionSegment
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
	 * Returns a promise to get all conversion segments with the given source id and destination id from the database. 
	 * If the conversion segment doesn't exist then return null.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestination(sourceId, destinationId, conn) {
		const rows = await conn.any(sqlFile('conversionSegment/get_by_source_destination.sql'), {
			sourceId: sourceId,
			destinationId: destinationId
		});
		return rows.map(ConversionSegment.mapRow);
	}

	/**
	 * Returns a promise to get the conversion segment associated with the given source id, destination id, startTime, and endTime from the database. 
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<ConversionSegment>}
	 */
	static async getBySourceDestinationStartEnd(sourceId, destinationId, startTime, endTime, conn) {
		const row = await conn.one(sqlFile('conversionSegment/get_by_source_destination_start_end.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
		return ConversionSegment.mapRow(row);
	}

	/**
	 * Inserts a new conversion segment to the database. Only segments spanning from -infinity to infinity are permitted.
	 * @param {*} conn The connection to be used.
	 */
	async insert(conn) {
		const conversionSegment = this;
		// check that the segment spans -infinity to infinity
		if (this.startTime !== '-infinity' || this.endTime !== 'infinity') {
			const errMsg = `Only time ranges spanning from -infinity to infinity are allowed for insertion.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		// check it doesn't exist in the database
		const row = await conn.any(sqlFile('conversionSegment/get_by_source_destination.sql'), conversionSegment);
		if (row.length > 0) {
			const errMsg = `Segment(s) exist for this conversion.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		await conn.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), conversionSegment);
	}

	/**
	 * Split a segment in two, the earlier segment uses the new slope/intercept/pattern/note
	 * @param {*} startTime When the current segment starts.
	 * @param {*} endTime When the current segment ends.
	 * @param {*} splitTime The time to split the segment at.
	 * @param {*} conn The connection to use
	 * @returns {Promise.<void>}
	 */
	async splitEarlier(startTime, endTime, splitTime, conn) {
		return conn.tx(async t => {
			// get all original values of the segment being split
			const originalSegment = await t.one(sqlFile('conversionSegment/get_by_source_destination_start_end.sql'), {
				sourceId: this.sourceId,
				destinationId: this.destinationId,
				startTime: startTime,
				endTime: endTime
			});

			// later segment - update start time
			await t.none(sqlFile('conversionSegment/update_conversion_segment.sql'), {
				sourceId: this.sourceId,
				destinationId: this.destinationId,
				weekPatternsId: originalSegment.weekPatternsId,
				slope: originalSegment.slope,
				intercept: originalSegment.intercept,
				startTime: splitTime,
				endTime: endTime,
				note: originalSegment.note,
				originalStartTime: startTime,
				originalEndTime: endTime
			});

			// earlier segment - insert new
			const earlierSegment = this;
			await t.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), earlierSegment);

		});
	}

	/**
	 * Split a segment in two, the later segment uses the new slope/intercept/pattern/note
	 * @param {*} startTime When the current segment starts.
	 * @param {*} endTime When the current segment ends.
	 * @param {*} splitTime The time to split the segment at.
	 * @param {*} conn The connection to use
	 * @returns {Promise.<void>}
	 */
	async splitLater(startTime, endTime, splitTime, conn) {
		return conn.tx(async t => {
			// get all original values of the segment being split
			const originalSegment = await t.one(sqlFile('conversionSegment/get_by_source_destination_start_end.sql'), {
				sourceId: this.sourceId,
				destinationId: this.destinationId,
				startTime: startTime,
				endTime: endTime
			});

			// earlier segment - update end time
			await t.none(sqlFile('conversionSegment/update_conversion_segment.sql'), {
				sourceId: this.sourceId,
				destinationId: this.destinationId,
				weekPatternsId: originalSegment.weekPatternsId,
				slope: originalSegment.slope,
				intercept: originalSegment.intercept,
				startTime: startTime,
				endTime: splitTime,
				note: originalSegment.note,
				originalStartTime: startTime,
				originalEndTime: endTime
			});

			// later segment - insert new
			const earlierSegment = this;
			await t.none(sqlFile('conversionSegment/insert_new_conversion_segment.sql'), earlierSegment);
		});
	}

	/**
	 * Updates an existed conversion segment in the database.
	 * @param {*} originalStartTime The original start time of the segment being updated.
	 * @param {*} originalEndTime The original end time of the segment being updated.
	 * @param {*} conn The connection to use.
	 */
	async update(originalStartTime, originalEndTime, conn) {
		const conversionSegment = {
			...this,
			originalStartTime,
			originalEndTime
		};
		const startChanged = this.startTime !== originalStartTime
		const endChanged = this.endTime !== originalEndTime;

		// check that -infinity and infinity aren't being updated
		if ((startChanged && (originalStartTime === '-infinity')) || endChanged && (originalEndTime === 'infinity')) {
			const errMsg = `Cannot update starting time of -infinity or ending time of infinity`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// update the previous segment's end time to the updated start time
			if (startChanged) {
				await t.none(sqlFile('conversionSegment/update_prev_seg_end_to_new_start.sql'), conversionSegment);
			}

			// update the next segment's start time to the updated end time
			if (endChanged) {
				await t.none(sqlFile('conversionSegment/update_next_seg_start_to_new_end.sql'), conversionSegment);
			}

			// Update the current segment
			await t.none(sqlFile('conversionSegment/update_conversion_segment.sql'), conversionSegment);
		});
}

	/**
	 * Deletes the conversion associated with the source, destination, start time, and end time from the database.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async delete(sourceId, destinationId, startTime, endTime, conn) {
		await conn.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
			sourceId: sourceId,
			destinationId: destinationId,
			startTime: startTime,
			endTime: endTime
		});
	}

	/**
	 * Delete conversion segment after updating the end time of the previous segment to the end time of the deleted segment.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async deleteEarlier(sourceId, destinationId, startTime, endTime, conn) {
		if (startTime === '-infinity') {
			const errMsg = `There is no earlier segment to update in order to delete this segment.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// update the end time of the previous segment
			await t.none(sqlFile('conversionSegment/update_prev_seg_end_to_curr_end.sql'), {
				sourceId: sourceId,
				destinationId: destinationId,
				startTime: startTime,
				endTime: endTime
			});

			// delete segment passed in
			await t.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
				sourceId: sourceId,
				destinationId: destinationId,
				startTime: startTime,
				endTime: endTime
			});
		});
	}

	/**
	 * Delete conversion segment after updating the start time of the following segment to the start time of the deleted segment.
	 * @param {*} sourceId The source meter's id.
	 * @param {*} destinationId The destination meter's id.
	 * @param {*} startTime The start time of the conversion segment.
	 * @param {*} endTime The end time of the conversion segment.
	 * @param {*} conn The connection to use.
	 */
	static async deleteLater(sourceId, destinationId, startTime, endTime, conn) {
		if (endTime === 'infinity') {
			const errMsg = `There is no later segment to update in order to delete this segment.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// delete segment passed in
			await t.none(sqlFile('conversionSegment/delete_conversion_segment.sql'), {
				sourceId: sourceId,
				destinationId: destinationId,
				startTime: startTime,
				endTime: endTime
			});
			// update the start time of the next segment
			await t.none(sqlFile('conversionSegment/update_next_seg_start_to_curr_start.sql'), {
				sourceId: sourceId,
				destinationId: destinationId,
				startTime: startTime,
				endTime: endTime
			});
		});
	}
}

module.exports = ConversionSegment;