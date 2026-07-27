/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 /*
 * Purpose:
 *
 *   This materialized view rolls up hourly meter readings into hourly group
 *   readings.
 *
 *
 * Data flow:
 *
 *    readings
 *       |
 *     trigger
 *       |
 *       v
 *   hypertable_hourly_split
 *       |
 *       v
 *   meter_hourly_readings_unit_cagg
 *       |
 *       v
 *   group_hourly_readings_unit_cagg
 *
 *
 * The aggregate combines meter-level hourly readings into group-level hourly
 * readings by summing all meters belonging to the group.
 *
 *
 * The group hourly aggregate applies group membership and graphic unit
 * filtering while preserving the hourly reporting interval format used by the
 * existing reporting layer.
 */

/*
 * Create the group materialized view over the TimescaleDB meter aggregate.
 *
 * Source:
 *
 *     meter_hourly_readings_unit_cagg
 *
 * The meter-level hourly aggregate already contains:
 *
 *     - Hourly time bucketing
 *     - Unit conversion
 *     - Time-varying conversion handling
 *
 * This aggregate only performs the group-level rollup.
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS group_hourly_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT
    gdm.group_id,
    SUM(hr.reading_rate) AS reading_rate,
    tsrange(
        time_bucket('1 hour', hr.bucket),
        time_bucket('1 hour', hr.bucket) + INTERVAL '1 hour',
        '()'
    ) AS time_interval,
    time_bucket('1 hour', hr.bucket) AS bucket,
    hr.graphic_unit_id
FROM meter_hourly_readings_unit_cagg hr INNER JOIN 
     groups_deep_meters_cache gdm ON hr.meter_id = gdm.meter_id INNER JOIN 
     group_graphic_units_cache gu ON gu.group_id = gdm.group_id AND hr.graphic_unit_id = gu.graphic_unit_id
GROUP BY
    gdm.group_id,
    time_bucket('1 hour', hr.bucket),
    hr.graphic_unit_id
WITH NO DATA;

-- This should improve group continuous-aggregate refreshes
CREATE INDEX IF NOT EXISTS group_hourly_cagg_group_graphic_bucket_idx
ON group_hourly_readings_unit_cagg
    (group_id, graphic_unit_id, bucket);

/*
 * Allow queries to include recent data that has not yet been materialized.
 */
ALTER MATERIALIZED VIEW group_hourly_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);

/*
 * Preserve existing database ownership.
 */
ALTER TABLE group_hourly_readings_unit_cagg
OWNER TO oed;