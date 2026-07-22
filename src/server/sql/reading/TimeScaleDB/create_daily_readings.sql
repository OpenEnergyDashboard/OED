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
CREATE MATERIALIZED VIEW IF NOT EXISTS meter_daily_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT
    meter_id,
    sum((reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) * extract(EPOCH FROM (end_timestamp - start_timestamp))) / sum(extract(EPOCH FROM (end_timestamp - start_timestamp))) AS reading_rate,
    max(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS max_rate,
    min(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS min_rate,
	tsrange(
        time_bucket('1 day', start_timestamp),
        time_bucket('1 day', start_timestamp) + INTERVAL '1 day',
        '()'
    ) AS time_interval,
    graphic_unit_id,
	time_bucket('1 day', start_timestamp) AS bucket
FROM hypertable_hourly_split
GROUP BY
    meter_id,
    time_bucket('1 day', start_timestamp),
    graphic_unit_id
ORDER BY
    meter_id,
    graphic_unit_id,
    bucket
WITH NO DATA;

/*
 * Allow queries to include recent data that has not yet been materialized.
 */
ALTER MATERIALIZED VIEW meter_daily_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);
