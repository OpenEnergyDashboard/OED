-- Table vs. Hypertable

-- Table
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM readings
WHERE start_timestamp >= '2020-01-01'
AND start_timestamp <  '2021-02-01';
-- Planning time: 1.692ms
-- Execution time: 95.339ms

-- Hypertable
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM readings_hypertable
WHERE start_timestamp >= '2020-01-01'
AND start_timestamp <  '2021-02-01';
-- Planning time: 18.903ms
-- Execution time: 34.905ms


-- Materialized View vs. Continuous Aggregate

-- Short - 1 Week
-- Materialized View
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hourly_readings_unit
WHERE lower(time_interval) >= '2021-03-01'
AND lower(time_interval) <  '2021-03-08';
-- Planning time: 0.345ms
-- Execution time: 4.524ms

-- Continuous Aggregate
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cagg_hourly_readings_unit
WHERE time_interval >= '2021-03-01'
AND time_interval <  '2021-03-08';
-- Planning time: 0.569ms
-- Execution time: 0.475ms

-- Medium - 3 Months
-- Materialized View
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hourly_readings_unit
WHERE lower(time_interval) >= '2021-03-01'
AND lower(time_interval) <  '2021-06-01';
-- Planning time: 0.183ms
-- Execution time: 2.868ms

-- Continuous Aggregate
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cagg_hourly_readings_unit
WHERE time_interval >= '2021-03-01'
AND time_interval <  '2021-06-01';
-- Planning time: 0.586ms
-- Execution time: 1.910ms

-- Long - 1 Year
-- Materialized View
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hourly_readings_unit
WHERE lower(time_interval) >= '2021-01-01'
AND lower(time_interval) <  '2022-01-01';
-- Planning time: 0.142ms
-- Execution time: 4.786ms

-- Continuous Aggregate
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cagg_hourly_readings_unit
WHERE time_interval >= '2021-01-01'
AND time_interval <  '2022-01-01';
-- Planning time: 1.134ms
-- Execution time: 4.277ms