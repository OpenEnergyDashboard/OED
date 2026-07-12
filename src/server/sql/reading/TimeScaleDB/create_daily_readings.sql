/*
 * create_daily_readings.sql
 *
 * This continuous aggregate rolls up the hourly continuous aggregate into
 * daily summaries. Rather than aggregating directly from
 * hypertable_hourly_split, it reuses the pre-computed hourly values produced
 * by meter_hourly_readings_unit_cagg.
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
 *   meter_daily_readings_unit_cagg
 *
 *
 * Building the daily aggregate on top of the hourly aggregate allows
 * TimescaleDB to reuse previously computed hourly results instead of
 * recalculating daily values from the raw split data. This significantly
 * reduces the amount of data processed during refreshes and mirrors the
 * hierarchical aggregation strategy commonly used in time-series workloads.
 *
 *
 * Daily aggregation:
 *
 * Each row in meter_hourly_readings_unit_cagg represents the aggregated
 * statistics for a single meter, graphic unit, and hour.
 *
 * The daily continuous aggregate groups those hourly rows into one-day
 * buckets and computes:
 *
 *   - Average hourly reading rate for the day.
 *   - Minimum hourly reading rate observed during the day.
 *   - Maximum hourly reading rate observed during the day.
 *
 *
 * Time interval:
 *
 * Rather than exposing the bucket timestamp directly, the daily aggregate
 * returns a PostgreSQL tsrange representing the entire day. This matches the
 * interval representation used throughout the reporting layer.
 *
 * Example:
 *
 *     ("2021-06-01 00:00:00","2021-06-02 00:00:00")
 *
 * The lower bound is the start of the day and the upper bound is the start
 * of the following day.
 */
DROP MATERIALIZED VIEW IF EXISTS meter_daily_readings_unit_cagg;

CREATE MATERIALIZED VIEW meter_daily_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT

    /*
     * Meter being aggregated.
     */
    meter_id,


    /*
     * Average hourly reading rate across the day.
     */
    AVG(reading_rate) AS reading_rate,


    /*
     * Lowest hourly reading rate observed during the day.
     */
    MIN(min_rate) AS min_rate,


    /*
     * Highest hourly reading rate observed during the day.
     */
    MAX(max_rate) AS max_rate,


    /*
     * Represent the daily bucket as a PostgreSQL timestamp range.
     *
     * The interval begins at the start of the day and ends at the start of
     * the following day.
     */
    tsrange(
        time_bucket('1 day', bucket),
        time_bucket('1 day', bucket) + INTERVAL '1 day',
        '()'
    ) AS time_interval,


    /*
     * Preserve the destination graphic unit so values remain grouped by the
     * converted reporting unit.
     */
    graphic_unit_id


FROM meter_hourly_readings_unit_cagg


/*
 * Roll hourly aggregates into daily buckets.
 */
GROUP BY
    meter_id,
    time_bucket('1 day', bucket),
    graphic_unit_id


/*
 * Order output for deterministic results when querying the materialized view.
 */
ORDER BY
    meter_id,
    graphic_unit_id,
    time_interval

WITH NO DATA;


ALTER MATERIALIZED VIEW meter_daily_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);
