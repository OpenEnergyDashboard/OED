/*
 * create_group_hourly_readings.sql
 *
 * Purpose:
 *
 *   Create the TimescaleDB continuous aggregate used for hourly group
 *   readings.
 *
 * Data flow:
 *
 *   meter_hourly_readings_unit_cagg
 *               │
 *               ▼
 *      groups_deep_meters
 *               │
 *               ▼
 *   group_hourly_readings_unit_cagg
 *
 * Notes:
 *
 *   - The continuous aggregate is built from
 *     meter_hourly_readings_unit_cagg.
 *
 *   - Meter hourly readings have already been split into hourly buckets
 *     and converted into the requested graphic units.
 *
 *   - Group readings are created by summing the hourly readings of all
 *     meters that belong to each group.
 *
 *   - Refreshing the aggregate is performed separately using
 *     refresh_continuous_aggregate() or a refresh policy.
 */

/*
 * 1. Create continuous aggregate for hourly group readings.
 *
 * This continuous aggregate replaces the existing
 * group_hourly_readings_unit materialized view using
 * TimescaleDB's incremental aggregation engine.
 *
 * Data flow:
 *
 *   meter_hourly_readings_unit_cagg
 *               │
 *               ▼
 *      groups_deep_meters
 *               │
 *               ▼
 *   group_hourly_readings_unit_cagg
 *
 * The meter hourly continuous aggregate already contains:
 *
 *   - hourly reading buckets
 *   - converted reading rates
 *   - graphic unit identifiers
 *
 * Therefore, this continuous aggregate only needs to:
 *
 *   1. Map each meter to its groups.
 *   2. Sum the hourly readings for every group.
 *   3. Group the results by hour and graphic unit.
 *
 * No additional joins to cik_vary or unit conversion tables are
 * required because all conversions have already been applied by
 * meter_hourly_readings_unit_cagg.
 */
 
CREATE MATERIALIZED VIEW group_hourly_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT
    gdm.group_id,
    mh.graphic_unit_id,
    time_bucket('1 hour', mh.bucket) AS bucket,
    SUM(mh.reading_rate) AS reading_rate
FROM meter_hourly_readings_unit_cagg mh
INNER JOIN groups_deep_meters gdm
    ON mh.meter_id = gdm.meter_id
INNER JOIN unnest(get_graphic_unit(gdm.group_id)) AS gu(graphic_unit_id)
    ON mh.graphic_unit_id = gu.graphic_unit_id
GROUP BY
    gdm.group_id,
    mh.graphic_unit_id,
    time_bucket('1 hour', mh.bucket)
WITH NO DATA;

ALTER MATERIALIZED VIEW group_hourly_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);