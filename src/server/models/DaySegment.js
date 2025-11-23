/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
const { start } = require('repl');
const database = require('./database');
const sqlFile = database.sqlFile;

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
     * Delete the day segment associated with the id
     * @param {*} id The day segment id.
     * @param {*} conn The connection to use.
     */
    static async delete(id, conn) {
        await conn.none(sqlFile('daySegment/delete_day_segment.sql'), {
            id: id
        });
    }

    /**
     * Get all DaySegment objects
     * @param {*} conn The database connection to use.
     * @returns all DaySegment objects.
     */
    static async getAll(conn) {
        const rows = await conn.any(sqlFile('daySegment/get_all.sql'));
        return rows.map(DaySegment.mapRow);
    }

    // /**
    //  * Get day segments by day name
    //  * @param {*} day_name The day name.
    //  * @param {*} conn The database connection to use.
    //  * @returns all DaySegment objects.
    //  */
    // static async getByDayName(day_name, conn) {
    //     const rows = await conn.any(sqlFile('daySegment/get_by_day_name.sql'), {
    //         day_name: day_name
    //     });

    //     return rows.map(DaySegment.mapRow);
    // }

    /** 
     * Returns the day segment associated the id. If the day segment doesn't exist then return null.
     * @param {*} id The day segment id.
     * @param {*} conn The connection to use.
     * @returns {Promise.<DaySegment>}
     */
    static async getById(id, conn) {
        const row = await conn.one(sqlFile('daySegment/get_by_id.sql'), {
            id: id
        });
        return row === null ? null : DaySegment.mapRow(row);
    }

    /** 
     * Returns the day segments associated with the day id.
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
     * Returns a promise to insert the day segment.
     * 
     * @param {*} conn The connection to be used
     * @returns {Promise.<void>}
     */
    async insert(conn) {
        const daySegment = this;
        if (daySegment.id !== undefined) {
            throw new Error('Attempted to insert a day segment that already has an ID');
        }

        const resp =  await conn.none(sqlFile('daySegment/insert_new_day_segment.sql'), daySegment);
    }

    //  /**
    //  * Inserts a new day segment. Rebuilds surrounding segments to ensure full 00:00 - 24:00 coverage.
    //  * 
    //  * @param {*} day_pattern_id The day pattern id the segment belongs to.
    //  * @param {*} startHour The start hour of the segment (inclusive).
    //  * @param {*} endHour The end hour of the segment (exclusive).
    //  * @param {*} slope The conversion slope.
    //  * @param {*} intercept The conversion intercept.
    //  * @param {*} note Optional admin note.
    //  * @param conn The database connection to use.
    //  */
    //  static async insert(day_pattern_id, startHour, endHour, slope, intercept, note, conn) {
    //     const getOverlapping = sqlFile('daySegment/get_overlapping_segments.sql');
    //     const deleteOverlapping = sqlFile('daySegment/delete_overlapping_segments.sql');
    //     const insertSegment = sqlFile('daySegment/insert_new_day_segment.sql');

    //     // Fetch overlapping segments
    //     const overlapping = await conn.any(getOverlapping, {
    //         dayId: day_pattern_id,
    //         startHour: startHour,
    //         endHour: endHour
    //     });

    //     // Delete overlapping segments
    //     await conn.none(deleteOverlapping, {
    //         dayId: day_pattern_id,
    //         startHour: startHour,
    //         endHour: endHour
    //     });

    //     // Reinsert trimmed segments
    //     for (const seg of overlapping) {
    //         if (seg.startHour < startHour) {
    //             await conn.none(insertSegment, {
    //                 day_pattern_id: day_pattern_id,
    //                 startHour: seg.startHour,
    //                 endHour: startHour,
    //                 slope: seg.slope,
    //                 intercept: seg.intercept,
    //                 note: seg.note
    //             });
    //         }
    //         if (seg.endHour > endHour) {
    //             await conn.none(insertSegment, {
    //                 day_pattern_id: day_pattern_id,
    //                 startHour: endHour,
    //                 endHour: seg.endHour,
    //                 slope: seg.slope,
    //                 intercept: seg.intercept,
    //                 note: seg.note
    //             });
    //         }
    //     }

    //     // insert the new segment
    //     await conn.none(insertSegment, {
    //         day_pattern_id: day_pattern_id,
    //         startHour: startHour,
    //         endHour: endHour,
    //         slope: slope,
    //         intercept: intercept,
    //         note: note
    //     });
    // }
    
    /**
     * Returns a promise to update an existing daySegment in the database.
     * @param conn the connection to use.
     * @returns {Promise.<>}
     */
    async update(conn) {
        const daySegment = this;
        if (daySegment.id === undefined) {
            throw new Error('Attempted to update a daySegment with no ID');
        }
        await conn.none(sqlFile('daySegment/update_day_segment.sql'), daySegment);
    }
}

module.exports = DaySegment;