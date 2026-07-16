CREATE MATERIALIZED VIEW group_daily_readings_unit_cagg
WITH (timescaledb.continuous)
AS
SELECT
    group_id,
    graphic_unit_id,
    time_bucket('1 day', bucket) AS bucket,
    AVG(reading_rate) AS reading_rate
FROM group_hourly_readings_unit_cagg
GROUP BY
    group_id,
    graphic_unit_id,
    time_bucket('1 day', bucket)
WITH NO DATA;

ALTER MATERIALIZED VIEW group_daily_readings_unit_cagg
SET (
    timescaledb.materialized_only = false
);