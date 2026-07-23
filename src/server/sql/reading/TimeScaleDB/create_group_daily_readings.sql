/*
 * group_daily_readings_unit_cagg.sql
 *
 * Purpose:
 *
 *   This materialized view rolls up daily meter readings into daily group
 *   readings.
 *
 *
 * Data flow:
 *
 *   readings
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
CREATE MATERIALIZED VIEW IF NOT EXISTS group_daily_readings_unit_cagg AS
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
	 groups_deep_meters gdm ON dr.meter_id = gdm.meter_id JOIN
	 LATERAL unnest(get_graphic_unit(gdm.group_id)) gu(graphic_unit_id) ON dr.graphic_unit_id = gu.graphic_unit_id
GROUP BY
    gdm.group_id,
    time_bucket('1 day', dr.bucket),
    dr.graphic_unit_id
WITH NO DATA;

ALTER TABLE group_daily_readings_unit_cagg
OWNER TO oed;
