/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { original } = require('@reduxjs/toolkit');
const database = require('./database');
const sqlFile = database.sqlFile;
const { log } = require('../log');

class DaySegment {
	/**
	 * @param {*} id This day_segments' id.
	 * @param {*} dayId The foreign key to the day_patterns table represents the day the segment belongs to.
	 * @param {*} startHour The hour the segment starts at.
	 * @param {*} endHour The hour the segment ends at.
	 * @param {*} slope The slope of the conversion.
	 * @param {*} intercept The intercept of the conversion.
	 * @param {*} note Comments by the admin.
	 */
	constructor(id, dayId, startHour, endHour, slope, intercept, note) {
		this.id = id;
		this.dayId = dayId;
		this.startHour = startHour;
		this.endHour = endHour;
		this.slope = slope;
		this.intercept = intercept;
		this.note = note;
	}
	/**
	 * Returns a promise to create the day_segments table.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<>}
	 */
	static createTable(conn) {
		return conn.none(sqlFile('daySegment/create_day_segments_table.sql'));
	}

	/**
	 * Create a new DaySegment object from the row's data.
	 * @param {*} row The row from which DaySegment will be created.
	 * @returns the created DaySegment object.
	 */
	 static mapRow(row) {
		return new DaySegment(
			row.id,
			row.day_id,
			row.start_hour,
			row.end_hour,
			row.slope,
			row.intercept,
			row.note
		);
	}

	/**
	 * Returns the day segment associated the id.
	 * If the day segment doesn't exist then return null.
	 * @param {*} id The day segment id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<DaySegment>}
	 */
	static async getById(id, conn) {
		const row = await conn.one(sqlFile('daySegment/get_by_id.sql'), {
			id: id
		});
		return DaySegment.mapRow(row);
	}

	/**
	 * Returns all day segments associated with the day id.
	 * @param {*} dayId The day pattern id.
	 * @param {*} conn The connection to use.
	 * @returns {Promise.<DaySegment>}
	 */
	static async getByDayId(dayId, conn) {
		const rows = await conn.any(sqlFile('daySegment/get_by_dayId.sql'), {
			dayId: dayId
		});
		return rows.map(DaySegment.mapRow)
	}

	/**
	 * Returns a promise to insert the day segment. Only segments spanning from 0 to 24 are permitted.
	 * @param {*} conn The connection to be used
	 * @returns {Promise.<void>}
	 */
	async insert(conn) {
		const daySegment = this;

		// check that the segment spans 0 to 24
		if (this.startHour !== 0 || this.endHour !== 24) {
			const errMsg = `Only time ranges spanning from 0 to 24 are allowed for insertion.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		// check it doesn't exist in the database
		const row = await conn.any(sqlFile('daySegment/get_by_dayId.sql'), daySegment);
		if (row.length > 0) {
			const errMsg = `Segment(s) exist for this day.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		await conn.none(sqlFile('daySegment/insert_new_day_segment.sql'), daySegment);
	}

	/**
	 * Split a segment in two, the earlier segment uses the new slope/intercept/note
	 * @param {*} id The id of the original day segment.
	 * @param {*} newSlope The slope for the new day segment.
	 * @param {*} newIntercept The intercept for the new day segment.
	 * @param {*} newNote The note for the new day segment.
	 * @param {*} splitTime The time to split the segment at.
	 * @param {*} conn The connection to be used.
	 * @returns {Promise.<void>}
	 */
	static async splitEarlier(id, newSlope, newIntercept, newNote, splitTime, conn) {
		return conn.tx(async t => {
			// get all data for the original segment
			const originalSegment = await t.one(sqlFile('daySegment/get_by_id.sql'), {
				id: id
			});

			// split time must be between original start and end time
			if (!(splitTime > originalSegment.start_hour && splitTime < originalSegment.end_hour)) {
				const errMsg = `The time to split the segment at must be within the range of the original segment: ${originalSegment.start_hour} and ${originalSegment.end_hour}`;
				log.error(errMsg);
				throw new Error(errMsg);
			}

			// earlier segment - insert new
			const earlierSegment = {
				dayId: originalSegment.day_id,
				startHour: originalSegment.start_hour,
				endHour: splitTime,
				slope: newSlope,
				intercept: newIntercept,
				note: newNote
			};

			// console.log(earlierSegment);
			await t.none(sqlFile('daySegment/insert_new_day_segment.sql'), earlierSegment);

			// later segment - update start time
			await t.none(sqlFile('daySegment/update_day_segment.sql'), {
				id: id,
				dayId: originalSegment.day_id,
				startHour: splitTime,
				endHour: originalSegment.end_hour,
				slope: originalSegment.slope,
				intercept: originalSegment.intercept,
				note: originalSegment.note
			});
		});
	}

	/**
	 * Split a segment in two, the later segment uses the new slope/intercept/note
	 * @param {*} id The id of the original day segment.
	 * @param {*} newSlope The slope for the new day segment.
	 * @param {*} newIntercept The intercept for the new day segment.
	 * @param {*} newNote The note for the new day segment.
	 * @param {*} splitTime The time to split the segment at.
	 * @param {*} conn The connection to be used.
	 * @returns {Promise.<void>}
	 */
	static async splitLater(id, newSlope, newIntercept, newNote, splitTime, conn) {
		return conn.tx(async t => {
			// get all data for the original segment
			const originalSegment = await t.one(sqlFile('daySegment/get_by_id.sql'), {
				id: id
			});

			// split time must be between original start and end time
			if (!(splitTime > originalSegment.start_hour && splitTime < originalSegment.end_hour)) {
				const errMsg = `The time to split the segment at must be within the range of the original segment: ${originalSegment.start_hour} and ${originalSegment.end_hour}`;
				log.error(errMsg);
				throw new Error(errMsg);
			}

			// later segment - insert new
			const laterSegment = {
				dayId: originalSegment.day_id,
				startHour: splitTime,
				endHour: originalSegment.end_hour,
				slope: newSlope,
				intercept: newIntercept,
				note: newNote
			};

			// console.log(earlierSegment);
			await t.none(sqlFile('daySegment/insert_new_day_segment.sql'), laterSegment);

			// earlier segment - update end time
			await t.none(sqlFile('daySegment/update_day_segment.sql'), {
				id: id,
				dayId: originalSegment.day_id,
				startHour: originalSegment.start_hour,
				endHour: splitTime,
				slope: originalSegment.slope,
				intercept: originalSegment.intercept,
				note: originalSegment.note
			});
		});
	}

	/**
	 * Returns a promise to update a daySegment in the database.
	 * @param {*} originalStartHour The original start hour of the segment being updated
	 * @param {*} originalEndHour The original end hour of the segment being updated
	 * @param {*} conn the connection to use.
	 * @returns {Promise.<>}
	 */
	async update(originalStartHour, originalEndHour, conn) {
		const daySegment = {
			...this,
			originalStartHour,
			originalEndHour
		};

		const startChanged = this.startHour !== originalStartHour;
		const endChanged = this.endHour !== originalEndHour;

		// check that 0 and 24 aren't being updated
		if ((startChanged && (originalStartHour === 0)) || endChanged && (originalEndHour === 24)) {
			const errMsg = `Cannot update starting hour of 0 or ending hour of 24`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// Check and update previous segment's end time to updated start time
			if (startChanged) {
				await t.none(sqlFile('daySegment/update_prev_seg_end_to_new_start.sql'), daySegment);
			}

			// Check and update next segment's start time to updated end time
			if (endChanged) {
				await t.none(sqlFile('daySegment/update_next_seg_start_to_new_end.sql'), daySegment);
			}

			// update the current segment
			await t.none(sqlFile('daySegment/update_day_segment.sql'), daySegment);
		});
	}

	/**
	 * Delete the day segment associated with the dayId, startHour, and endHour.
	 * This method does not update the previous or next segments.
	 * @param {*} dayId The dayId of the segment.
	 * @param {*} startHour The start hour of the segment to delete.
	 * @param {*} endHour The end hour of the segment to delete.
	 * @param {*} conn The connection to use.
	 * @param {*} startHour The start hour of the segment to be deleted.
	 * @param {*} endHour The end hour of the segment to be deleted.
	 */
	static async delete(dayId, startHour, endHour, conn) {
		await conn.none(sqlFile('daySegment/delete_day_segment.sql'), {
			dayId: dayId,
			startHour: startHour,
			endHour: endHour
		});
	}

	/**
	 * Delete day segment after updating the end time of the previous segment to the end time of the deleted segment.
	 * @param {*} dayId The id for the day segment to be deleted.
	 * @param {*} startHour The start hour of the segment to delete.
	 * @param {*} endHour The end hour of the segment to delete.
	 * @param {*} conn The connection to use.
	 */
	static async deleteEarlier(dayId, startHour, endHour, conn) {
		if (startHour === 0) {
			const errMsg = `There is no earlier segment to update in order to delete this segment.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// update the end time of the previous segment
			await t.none(sqlFile('daySegment/update_prev_seg_end_to_curr_end.sql'), {
				dayId: dayId,
				startHour: startHour,
				endHour: endHour
			});

			// delete segment passed in
			await t.none(sqlFile('daySegment/delete_day_segment.sql'), {
				dayId: dayId,
				startHour: startHour,
				endHour: endHour
			});
		});
	}

	/**
	 * Delete day segment after updating the start time of the following segment to the start time of the deleted segment.
	 * @param {*} dayId The day id of the day segment to be deleted.
	 * @param {*} startHour The start hour of the segment to delete.
	 * @param {*} endHour The end hour of the segment to delete.
	 * @param {*} conn The connection to use.
	 */
	static async deleteLater(dayId, startHour, endHour, conn) {
		if (endHour === 24) {
			const errMsg = `There is no later segment to update in order to delete this segment.`;
			log.error(errMsg);
			throw new Error(errMsg);
		}

		return conn.tx(async t => {
			// update the start time of the following segment
			await t.none(sqlFile('daySegment/update_next_seg_start_to_curr_start.sql'), {
				dayId: dayId,
				startHour: startHour,
				endHour: endHour
			});

			// delete segment passed in
			await t.none(sqlFile('daySegment/delete_day_segment.sql'), {
				dayId: dayId,
				startHour: startHour,
				endHour: endHour
			});
		});
	}
}

module.exports = DaySegment;
