/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
/*
 * Purpose:
 *
 *   This materialized view rolls up daily meter readings into daily group
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
 *   group_daily_readings_unit_cagg
 *
 *
 * The view combines meter-level daily readings into group-level daily
 * readings by summing all meters belonging to the group.
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS group_daily_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT
    gdm.group_id,
    SUM(dr.reading_rate) AS reading_rate,
    tsrange(
        time_bucket('1 day', dr.bucket),
        time_bucket('1 day', dr.bucket) + INTERVAL '1 day',
        '()'
    ) AS time_interval,
    time_bucket('1 day', dr.bucket) AS bucket,
    dr.graphic_unit_id
FROM meter_daily_readings_unit_cagg dr JOIN 
     groups_deep_meters_cache gdm ON dr.meter_id = gdm.meter_id JOIN 
     group_graphic_units_cache gu ON gu.group_id = gdm.group_id AND dr.graphic_unit_id = gu.graphic_unit_id
GROUP BY
    gdm.group_id,
    time_bucket('1 day', dr.bucket),
    dr.graphic_unit_id
WITH NO DATA;

-- This should improve group continuous-aggregate refreshes
CREATE INDEX IF NOT EXISTS group_daily_cagg_group_graphic_bucket_idx
ON group_daily_readings_unit_cagg
    (group_id, graphic_unit_id, bucket);

/*
 * Allow queries to include recent data that has not yet been materialized.
 */
ALTER MATERIALIZED VIEW group_daily_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);

/*
 * Preserve existing database ownership.
 */
ALTER TABLE group_daily_readings_unit_cagg
OWNER TO oed;
