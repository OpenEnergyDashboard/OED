/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../database');
const moment = require('moment');

const sqlFile = database.sqlFile;

class Reading {

    /**
     * Creates the TimescaleDB prerequisite objects required by the hourly and
     * daily continuous aggregates.
     *
     * This creates:
     *   - hypertable_hourly_split
     *   - supporting indexes
     *   - trigger function
     *   - trigger
     *   - rebuild function
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createPrerequisites(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_prerequisites.sql'));
    }

    /**
     * Drops the TimescaleDB reading continuous aggregates in reverse
     * dependency order so they can be recreated safely.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static dropReadingAggregates(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/drop_reading_aggregates.sql'));
    }

    /**
     * Creates the TimescaleDB continuous aggregate used for hourly meter
     * readings.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createHourlyReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_hourly_readings.sql'));
    }

    /**
     * Creates the TimescaleDB continuous aggregate used for daily meter
     * readings.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createDailyReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_daily_readings.sql'));
    }

    /**
     * Updates meter_line_readings_unit() to use the TimescaleDB continuous
     * aggregates for hourly and daily queries.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static updateMeterLineReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_meter_line_readings_unit.sql'));
    }

    /**
     * Refreshes the TimescaleDB continuous aggregates.
     *
     * This should be called after importing or modifying readings, especially
     * when historical data may have been inserted or updated.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static async rebuildReadings(conn) {
        // Rebuild the hypertable in case conversion metadata (cik_vary)
        // has changed or historical readings were imported.
        await conn.any('SELECT rebuild_hourly_hypertable_split()');

        await Reading.refreshReadings(conn);
    }

    /**
     * Refreshes the TimescaleDB continuous aggregates for an optional time
     * range. Omitting the range refreshes all materialized data.
     *
     * Hourly must be refreshed before daily because the daily continuous
     * aggregate depends on the hourly continuous aggregate.
     *
     * @param conn the database connection to use
     * @param startTimestamp inclusive start of the affected range
     * @param endTimestamp exclusive end of the affected range
     * @returns {Promise<void>}
     */
    static async refreshReadings(conn, startTimestamp = null, endTimestamp = null) {
        if ((startTimestamp === null) !== (endTimestamp === null)) {
            throw new Error('Both startTimestamp and endTimestamp are required for a bounded TimescaleDB refresh.');
        }

        // A daily continuous aggregate only materializes complete buckets.
        // Expand bounded imports to UTC day boundaries so both the hourly and
        // daily aggregates cover every affected bucket.
        const refreshStart = startTimestamp === null ? null : moment.utc(startTimestamp).startOf('day');
        const refreshEnd = endTimestamp === null ? null : moment.utc(endTimestamp).startOf('day');
        if (refreshEnd !== null && !moment.utc(endTimestamp).isSame(refreshEnd)) {
            refreshEnd.add(1, 'day');
        }

        // Refresh the continuous aggregates.
        await conn.none(
            "CALL refresh_continuous_aggregate('meter_hourly_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );

        await conn.none(
            "CALL refresh_continuous_aggregate('meter_daily_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );
    }

}


module.exports = Reading;
