/*
 * Aggregating directly from hypertable_hourly_split, it will be used by by group_daily_readings_unit_cagg.
 * Therefore  it is necessaary to retain the bucket to allow for proper grouping in the next level of 
 * aggregation.
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
 *   meter_daily_readings_unit_cagg
 *
 *
 * Daily aggregation:
 *
 * Each row in hypertable_hourly_split represents the aggregated a single 
 * meter, graphic unit, and hour.
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
 * Exposes the bucket timestamp directly
 *
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
GROUP BY meter_id, time_bucket('1 day', start_timestamp), graphic_unit_id
ORDER BY meter_id, graphic_unit_id, bucket
WITH NO DATA;

/*
 * Allow queries to include recent data that has not yet been materialized.
 */
ALTER MATERIALIZED VIEW meter_daily_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);
