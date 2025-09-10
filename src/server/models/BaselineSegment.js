/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
const database = require('./database');
const { TimeInterval } = require('../../common/TimeInterval');
const { momentToIsoOrInfinity } = require('../util/handleTimestampValues');
const sqlFile = database.sqlFile;

class BaselineSegment {
    /**
     * @param {*} meterId The foreign key to the corresponding baseline/meter.
     * @param {*} baselineValue The baseline value within the segment.
     * @param {*} startTime The moment the segment starts.
     * @param {*} endTime The moment the segment ends.
     * @param {*} calcStart The moment the segment starts being calculated.
     * @param {*} calcEnd The moment the segment stops being calculated.
     * @param {*} note Comments by the admin or OED inserted.
     */
    constructor(meterId, baselineValue, startTime, endTime, calcStart, calcEnd, note) {
        this.meterId = meterId;
        this.baselineValue = baselineValue;
        this.startTime = momentToIsoOrInfinity(startTime);
        this.endTime = momentToIsoOrInfinity(endTime);
        this.calcStart = momentToIsoOrInfinity(calcStart);
        this.calcEnd = momentToIsoOrInfinity(calcEnd);
        this.note = note;
    }

    /**
     * Returns a promise to create the baseline_segments table.
     * @param {*} conn The connection to use.
     * @returns {Promise.<>}
     */
    static createTable(conn) {
        // TODO: baseline segment table in db
        return conn.none(sqlFile('baselineSegment/create_baseline_segments_table.sql'));
    }

    /**
         * Updates an existed baseline segment in the database.
         * Note: This function only supports updates where the new start and/or end time extends into the immediately adjacent segments.
         * @param {*} originalStartTime The original start time of the segment being updated.
         * @param {*} originalEndTime The original end time of the segment being updated.
         * @param {*} conn The connection to use.
         */
    async update(originalStartTime, originalEndTime, conn) {
        const baselineSegment = {
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
                await t.none(sqlFile('baselineSegment/update_prev_seg_end_to_new_start.sql'), BaselineSegment);
            }

            // update the next segment's start time to the updated end time
            if (endChanged) {
                await t.none(sqlFile('baselineSegment/update_next_seg_start_to_new_end.sql'), baselineSegment);
            }

            // Update the current segment
            await t.none(sqlFile('baselineSegment/update_baseline_segment.sql'), baselineSegment);
        });
    }
}