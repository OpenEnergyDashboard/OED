/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 /*
 * Prefrace:
 * 	 This script continues the work introduced in PR#1546, which established the
 * 	 benchmark for migrating hourly meter reading queries from PostgreSQL
 * 	 materialized views to TimescaleDB hypertables and continuous aggregates.
 *
 * 	 Only the database objects required from PR#1546 were carried forward and
 * 	 adapted to integrate TimescaleDB continuous aggregates with the existing
 * 	 hourly meter reading workflow in the timeVary branch.
 *
 * Purpose:
 *
 *   Create the TimescaleDB continuous aggregate used for hourly meter
 *   readings.
 *
 * Data flow:
 *
 *    readings
 *       |
 *     trigger
 *       │
 *       ▼
 *   hypertable_hourly_split
 *       │
 *       ▼
 *   meter_hourly_readings_unit_cagg
 *
 * Notes:
 *
 *   - The continuous aggregate is built from hypertable_hourly_split.
 *   - Hourly reading slices are maintained by the trigger created in
 *     create_prerequisites.sql.
 *   - Refreshing the aggregate is performed separately using
 *     refresh_continuous_aggregate() or a refresh policy.
 */

/*
 * 1. Create continuous aggregate for hourly meter readings.
 *
 * This continuous aggregate replaces the existing
 * meter_hourly_readings_unit materialized view using TimescaleDB's
 * incremental aggregation engine.
 *
 * Data flow:
 *
 *   hypertable_hourly_split
 *           |
 *           v
 *   meter_hourly_readings_unit_cagg
 *
 *
 * The hourly split table already contains:
 *
 *   - hourly overlap calculations
 *   - cik_vary conversion parameters
 *   - unit metadata
 *
 * Therefore, the continuous aggregate does not need to join against
 * cik_vary or other lookup tables during query execution.
 *
 *
 * Reading calculation:
 *
 * hypertable_hourly_split stores reading contributions scaled by the
 * duration overlap within each hourly slice.
 *
 * To calculate the final hourly reading rate:
 *
 *   1. Convert the stored contribution back into a rate.
 *   2. Apply the cik_vary conversion:
 *
 *          converted_value = rate * slope + intercept
 *
 *   3. Weight the converted rate by the duration of the slice.
 *   4. Divide by the total duration to produce the weighted average.
 *
 * This reproduces the calculation performed by the original
 * meter_hourly_readings_unit materialized view.
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS meter_hourly_readings_unit_cagg
WITH (timescaledb.continuous) 
AS
SELECT
    meter_id,
    graphic_unit_id,
    time_bucket('1 hour', start_timestamp) AS bucket,
    sum(( reading / extract( EPOCH FROM (end_timestamp - start_timestamp) ) * slope + intercept ) * extract(EPOCH FROM (end_timestamp - start_timestamp))) / sum(extract(EPOCH FROM (end_timestamp - start_timestamp))) AS reading_rate,
    max(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS max_rate,
    min(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS min_rate,
    unit_represent,
    sec_in_rate
FROM hypertable_hourly_split
GROUP BY
    meter_id,
    graphic_unit_id,
    time_bucket('1 hour', start_timestamp),
    unit_represent,
    sec_in_rate
WITH NO DATA;

-- This should improve meter continuous-aggregate refreshes
CREATE INDEX IF NOT EXISTS meter_hourly_cagg_meter_graphic_bucket_idx
ON meter_hourly_readings_unit_cagg
    (meter_id, graphic_unit_id, bucket);

/*
 * Allow queries to include recent data that has not yet been materialized.
 */
ALTER MATERIALIZED VIEW meter_hourly_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);
