/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const database = require('../database');
const moment = require('moment');

const sqlFile = database.sqlFile;

class Reading {

    /**
     * Creates shared reading functions required by the TimescaleDB schema and
     * graphing functions.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createReadingHelpers(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_reading_views.sql'));
    }

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
     * Creates the group-level dependency objects required by the group hourly
     * and daily continuous aggregates.
     *
     * This creates:
     *   - groups_deep_meters_cache table
     *   - group_graphic_units_cache table
     *   - supporting indexes
     *
     * The group continuous aggregates cannot depend on dynamic joins to:
     *   - groups_deep_meters_cache maintenance logic
     *   - legacy graphic-unit compatibility function
     *
     * Therefore, these objects are maintained as physical tables that can be
     * refreshed before refreshing the group continuous aggregates.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createGroupDependencies(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_group_dependencies.sql'));
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
     * Creates the group hourly materialized view over the TimescaleDB meter
     * aggregate.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createGroupHourlyReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_group_hourly_readings.sql'));
    }

    /**
     * Creates the group daily materialized view over the TimescaleDB meter
     * aggregate.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static createGroupDailyReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/create_group_daily_readings.sql'));
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
     * Updates group_line_readings_unit() to use the group materialized views
     * backed by TimescaleDB meter aggregates for hourly and daily queries.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static updateGroupLineReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_group_line_readings_unit.sql'));
    }

    /**
     * Updates meter_bar_readings_unit() and group_bar_readings_unit() to use the group materialized views
     * backed by TimescaleDB meter aggregates for group_daily_readings_unit_cagg.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static updateMeterGroupBar(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_meter_group_bar.sql'));
    }

    /**
     * Updates meter_compare_readings_unit() and group_compare_readings_unit() to use the group
     * materialized views backed by TimescaleDB meter aggregates for group_daily_readings_unit_cagg.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static updateCompareReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_function_get_compare_readings.sql'));
    }

    /**
     * Updates the 3D reading functions to use TimescaleDB continuous
     * aggregates.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static updateFunctionGet3DReadings(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/update_function_get_3d_readings.sql'));
    }

    /**
     * TODO: Remove this function once the hypertable implementation is finalized.
     * Removes legacy PostgreSQL materialized reading views after their
     * TimescaleDB replacements and all dependent functions are installed.
     *
     * @param conn the database connection to use
     * @returns {Promise<void>}
     */
    static dropLegacyReadingViews(conn) {
        return conn.none(sqlFile('reading/TimeScaleDB/drop_legacy_reading_views.sql'));
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
     * Validates and expands an optional refresh range to UTC day boundaries.
     *
     * @param startTimestamp inclusive start of the affected range
     * @param endTimestamp exclusive end of the affected range
     * @returns {{refreshStart: moment.Moment|null, refreshEnd: moment.Moment|null}}
     */
    static getRefreshRange(startTimestamp = null, endTimestamp = null) {
        if ((startTimestamp === null) !== (endTimestamp === null)) {
            throw new Error('Both startTimestamp and endTimestamp are required for a bounded TimescaleDB refresh.');
        }

        const refreshStart = startTimestamp === null ? null : moment.utc(startTimestamp).startOf('day');
        const refreshEnd = endTimestamp === null ? null : moment.utc(endTimestamp).startOf('day');
        if (refreshEnd !== null && !moment.utc(endTimestamp).isSame(refreshEnd)) {
            refreshEnd.add(1, 'day');
        }

        return { refreshStart, refreshEnd };
    }

    /**
     * Refreshes only the hourly meter continuous aggregate.
     */
    static async refreshMeterHourlyReadings(conn, startTimestamp = null, endTimestamp = null) {
        const { refreshStart, refreshEnd } = Reading.getRefreshRange(startTimestamp, endTimestamp);
        await conn.none(
            "CALL refresh_continuous_aggregate('meter_hourly_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );
    }

    /**
     * Refreshes only the daily meter continuous aggregate.
     */
    static async refreshMeterDailyReadings(conn, startTimestamp = null, endTimestamp = null) {
        const { refreshStart, refreshEnd } = Reading.getRefreshRange(startTimestamp, endTimestamp);
        await conn.none(
            "CALL refresh_continuous_aggregate('meter_daily_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );
    }

    /**
     * Refreshes the hourly and daily meter continuous aggregates.
     */
    static async refreshMeterReadings(conn, startTimestamp = null, endTimestamp = null) {
        await Reading.refreshMeterHourlyReadings(conn, startTimestamp, endTimestamp);
        await Reading.refreshMeterDailyReadings(conn, startTimestamp, endTimestamp);
    }

    /**
     * Refreshes the group caches and group continuous aggregates.
     */
    static async refreshGroupReadings(conn, startTimestamp = null, endTimestamp = null) {
        const { refreshStart, refreshEnd } = Reading.getRefreshRange(startTimestamp, endTimestamp);

        await conn.none(`
            DO $$
            BEGIN
                PERFORM update_groups_deep_meters_cache();
                PERFORM update_group_graphic_units_cache();
            END
            $$;
        `);

        await conn.none(
            "CALL refresh_continuous_aggregate('group_hourly_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );

        await conn.none(
            "CALL refresh_continuous_aggregate('group_daily_readings_unit_cagg', ${startTimestamp}, ${endTimestamp})",
            { startTimestamp: refreshStart, endTimestamp: refreshEnd }
        );
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
        await Reading.refreshMeterReadings(conn, startTimestamp, endTimestamp);
        await Reading.refreshGroupReadings(conn, startTimestamp, endTimestamp);
    }

}


module.exports = Reading;
