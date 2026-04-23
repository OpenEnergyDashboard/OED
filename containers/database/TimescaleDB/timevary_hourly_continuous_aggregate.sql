/*
 * This file sets up the necessary database objects to benchmark TimescaleDB
 * continuous aggregates against the existing PostgreSQL materialized views
 * for hourly meter readings on the timeVary branch.
 *
 * It creates a readings hypertable (readings_hypertable) as a direct copy of
 * the readings table and a second hypertable (hypertable_hourly_split) that
 * splits raw meter readings into hourly intervals and applies the time varying
 * cik_vary conversions at split time. A continuous aggregate
 * (meter_hourly_readings_unit_cagg) is then built on top of hypertable_hourly_split
 * to replicate the meter_hourly_readings_unit materialized view as accurately
 * as possible.
 *
 * A separate hypertable was needed because TimescaleDB continuous aggregates
 * can only aggregate data, not expand it. Since meter_hourly_readings_unit splits
 * readings that span multiple hours into one row per hour, this splitting had to
 * be done in advance and stored in a separate hypertable before the continuous
 * aggregate could work with it. The cik_vary conversion (slope/intercept) is also
 * applied at split time and stored in the hypertable so the continuous aggregate
 * does not need to join to any other tables at query time.
 *
 * The continuous aggregate sits on top of hypertable_hourly_split and stores
 * pre-computed aggregated results from it, similar to how a materialized view
 * works in regular PostgreSQL. The underlying data always lives in the hypertable.
 *
 * The goal is to compare query speeds between the original materialized views
 * and TimescaleDB continuous aggregates to determine whether migrating to
 * TimescaleDB is worth the effort for the timeVary branch.
 *
 * Setup steps:
 * 1. Ensure the TimescaleDB extension is enabled in the oed database
 * 2. Ensure test data is populated (npm run testData)
 * 3. Run this file in pgAdmin against the oed database
 *
 * To tear down all objects created by this file:
 *     DROP MATERIALIZED VIEW IF EXISTS meter_hourly_readings_unit_cagg;
 *     DROP TABLE IF EXISTS hypertable_hourly_split;
 *     DROP TABLE IF EXISTS readings_hypertable;
 */

-- 1. Verify test data loaded correctly before proceeding.
SELECT COUNT(*) FROM readings;
SELECT COUNT(*) FROM meters;

-- 2. Create readings_hypertable as a separate copy of the readings table.
-- This keeps the original readings table untouched so other parts of the
-- codebase that query it directly are not affected.
CREATE TABLE readings_hypertable (
    meter_id INTEGER NOT NULL,
    reading FLOAT NOT NULL,
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP NOT NULL,
    CHECK (start_timestamp < end_timestamp),
    PRIMARY KEY (meter_id, start_timestamp)
);

-- 3. Convert readings_hypertable into a TimescaleDB hypertable, partitioned
-- by start_timestamp. This enables time-series optimizations and allows
-- continuous aggregates to be built on top.
SELECT create_hypertable('readings_hypertable', 'start_timestamp');

-- 4. Populate readings_hypertable with all data from the readings table.
INSERT INTO readings_hypertable SELECT * FROM readings;

-- 5. Verify readings_hypertable populated correctly.
-- Both counts should be identical.
SELECT COUNT(*) FROM readings_hypertable;
SELECT COUNT(*) FROM readings;

-- 6. Create hypertable_hourly_split to store readings split into hourly intervals
-- with cik_vary conversions applied at split time.
-- slope, intercept, and graphic_unit_id are included so the continuous aggregate
-- can apply the time varying conversion without needing to join to cik_vary at
-- query time. unit_represent and sec_in_rate are included to correctly handle
-- quantity, flow, and raw readings differently during aggregation.
CREATE TABLE hypertable_hourly_split (
    meter_id INTEGER NOT NULL,
    reading FLOAT NOT NULL,          -- Reading rate scaled by overlap duration
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP NOT NULL,
    unit_represent unit_represent_type NOT NULL,
    sec_in_rate FLOAT NOT NULL,
    slope FLOAT NOT NULL,            -- From cik_vary, used to convert reading to graphic unit
    intercept FLOAT NOT NULL,        -- From cik_vary, used to convert reading to graphic unit
    graphic_unit_id INTEGER NOT NULL -- The destination unit this conversion applies to
);

-- 7. Convert hypertable_hourly_split into a TimescaleDB hypertable.
SELECT create_hypertable('hypertable_hourly_split', 'start_timestamp');

-- 8. Populate hypertable_hourly_split by splitting each raw reading from
-- readings_hypertable into one row per hour it spans, and joining to cik_vary
-- to store the applicable conversion for each slice.
-- For example, a reading spanning 3 hours with 2 applicable conversions becomes
-- 6 rows — one per hour per conversion.
-- Quantity readings are converted to a rate per hour and scaled by overlap duration.
-- Flow/raw readings are already a rate, normalized to per hour using sec_in_rate,
-- and also scaled by overlap duration.
-- The slope and intercept from cik_vary are stored directly so the continuous
-- aggregate can apply them without any additional joins.
INSERT INTO hypertable_hourly_split
SELECT
    r.meter_id,
    CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
        -- Convert to rate per hour and scale by overlap duration within this hour slice
        (r.reading * 3600 / extract(EPOCH FROM (r.end_timestamp - r.start_timestamp))) *
        extract(EPOCH FROM (
            least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour')
            - greatest(r.start_timestamp, gen.interval_start)
        ))
    WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
        -- Normalize flow/raw to per hour and scale by overlap duration
        (r.reading * 3600 / u.sec_in_rate) *
        extract(EPOCH FROM (
            least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour')
            - greatest(r.start_timestamp, gen.interval_start)
        ))
    END AS reading,
    -- Clamp start/end timestamps to the hour boundary
    greatest(r.start_timestamp, gen.interval_start) AS start_timestamp,
    least(r.end_timestamp, gen.interval_start + INTERVAL '1 hour') AS end_timestamp,
    u.unit_represent,
    u.sec_in_rate,
    c.slope,
    c.intercept,
    c.destination_id AS graphic_unit_id
FROM readings_hypertable r
INNER JOIN meters m ON r.meter_id = m.id
INNER JOIN units u ON m.unit_id = u.id
-- Join to cik_vary using a time range overlap to get all applicable conversions
-- for each reading. The exclusive bounds '()' ensure no two conversions overlap.
INNER JOIN cik_vary c ON c.source_id = m.unit_id
    AND tsrange(c.start_time, c.end_time, '()') && tsrange(r.start_timestamp, r.end_timestamp, '[]')
-- Generate one row per hour that the reading spans
CROSS JOIN LATERAL generate_series(
    date_trunc('hour', r.start_timestamp),
    -- Subtract 1 hour because generate_series is end-inclusive
    date_trunc_up('hour', r.end_timestamp) - INTERVAL '1 hour',
    INTERVAL '1 hour'
) gen(interval_start);

-- 9. Verify row count of the hourly split hypertable.
-- Will be higher than meter_hourly_readings_unit since each raw reading
-- can produce multiple rows (one per hour per cik_vary conversion) before aggregation.
SELECT COUNT(*) FROM hypertable_hourly_split;
SELECT * FROM hypertable_hourly_split LIMIT 10;

-- 10. Check how many distinct (meter, hour, graphic_unit) combinations exist
-- in the hypertable. Should match the count from meter_hourly_readings_unit below.
SELECT COUNT(*) FROM (
    SELECT DISTINCT meter_id, date_trunc('hour', start_timestamp), graphic_unit_id
    FROM hypertable_hourly_split
) s;

-- 11. Check how many distinct (meter, hour, graphic_unit) combinations exist
-- in the materialized view. Should match the count from hypertable_hourly_split above.
SELECT COUNT(*) FROM (
    SELECT DISTINCT meter_id, lower(time_interval), graphic_unit_id
    FROM meter_hourly_readings_unit
) s;

-- 12. Create a continuous aggregate on top of hypertable_hourly_split.
-- This replicates the logic of meter_hourly_readings_unit but uses TimescaleDB's
-- continuous aggregate mechanism instead of a regular materialized view.
-- The reading in hypertable_hourly_split is already scaled by overlap duration,
-- so the weighted average is computed by dividing by duration to get the rate,
-- applying slope/intercept, then weighting by duration and normalizing.
-- This matches the two-step logic in meter_hourly_readings_unit:
--   Step 1 (base_hourly CTE): splits and computes raw reading rate
--   Step 2 (outer SELECT): applies cik_vary conversion
CREATE MATERIALIZED VIEW meter_hourly_readings_unit_cagg
WITH (timescaledb.continuous) AS
SELECT
    meter_id,
    graphic_unit_id,
    time_bucket('1 hour', start_timestamp) AS bucket,
    -- Weighted average reading rate by slice duration, with cik_vary conversion applied.
    -- Dividing reading by duration recovers the rate, applying slope/intercept converts it,
    -- then multiplying by duration and dividing by total duration gives the weighted average.
    sum(
        (reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept)
        * extract(EPOCH FROM (end_timestamp - start_timestamp))
    ) / sum(extract(EPOCH FROM (end_timestamp - start_timestamp))) AS reading_rate,
    -- Max and min rates with cik_vary conversion applied
    max(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS max_rate,
    min(reading / extract(EPOCH FROM (end_timestamp - start_timestamp)) * slope + intercept) AS min_rate,
    unit_represent,
    sec_in_rate
FROM hypertable_hourly_split
GROUP BY meter_id, graphic_unit_id, bucket, unit_represent, sec_in_rate;

-- 13. Verify row count of the continuous aggregate.
-- Should match the count from meter_hourly_readings_unit.
SELECT COUNT(*) FROM meter_hourly_readings_unit_cagg;
SELECT * FROM meter_hourly_readings_unit_cagg LIMIT 10;

-- 14. Compare reading_rate values between the original materialized view and
-- the continuous aggregate. Results are ordered by largest difference first
-- to surface any inaccuracies. Differences should be zero or extremely close
-- to zero (floating point rounding only).
SELECT
    mv.meter_id,
    lower(mv.time_interval) AS mv_time,
    mv.reading_rate AS mv_reading_rate,
    cagg.bucket AS cagg_time,
    cagg.reading_rate AS cagg_reading_rate,
    mv.reading_rate - cagg.reading_rate AS difference
FROM meter_hourly_readings_unit mv
INNER JOIN meter_hourly_readings_unit_cagg cagg
    ON mv.meter_id = cagg.meter_id
    AND lower(mv.time_interval) = cagg.bucket
    AND mv.graphic_unit_id = cagg.graphic_unit_id
ORDER BY abs(mv.reading_rate - cagg.reading_rate) DESC
LIMIT 20;

-- 15. Verify accuracy of max_rate and min_rate between the original materialized
-- view (meter_hourly_readings_unit) and the continuous aggregate
-- (meter_hourly_readings_unit_cagg). Results are ordered by largest max_rate
-- difference first to surface any inaccuracies. Differences should be zero or
-- extremely close to zero (floating point rounding only).
SELECT
    mv.meter_id,
    lower(mv.time_interval) AS mv_time,
    mv.max_rate AS mv_max_rate,
    cagg.max_rate AS cagg_max_rate,
    mv.max_rate - cagg.max_rate AS max_difference,
    mv.min_rate AS mv_min_rate,
    cagg.min_rate AS cagg_min_rate,
    mv.min_rate - cagg.min_rate AS min_difference
FROM meter_hourly_readings_unit mv
INNER JOIN meter_hourly_readings_unit_cagg cagg
    ON mv.meter_id = cagg.meter_id
    AND lower(mv.time_interval) = cagg.bucket
    AND mv.graphic_unit_id = cagg.graphic_unit_id
ORDER BY abs(mv.max_rate - cagg.max_rate) DESC
LIMIT 20;