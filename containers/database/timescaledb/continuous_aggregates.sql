-- Create Materialized View with continuous aggregates from hypertable.
CREATE MATERIALIZED VIEW cagg_hourly_readings_unit
WITH (timescaledb.continuous) AS
SELECT
    meter_id,
    AVG(reading) AS reading_rate,
    MAX(reading) AS max_rate,
    MIN(reading) AS min_rate,
    time_bucket(INTERVAL '1 hour', start_timestamp) AS time_interval
FROM readings_hypertable
GROUP BY
    meter_id,
    time_interval
WITH NO DATA;

-- Get earliest and latest timestamps for entire refresh period.
SELECT
    MIN(start_timestamp) AS earliest,
    MAX(start_timestamp) AS latest
FROM readings_hypertable;

-- Refresh continuous aggregates to generate all data from readings_hypertable
-- using earliest and latest timestamps from above.
CALL refresh_continuous_aggregate(
  'cagg_hourly_readings_unit',
  '2020-01-01 00:00:00',
  '2021-12-31 23:45:00'
);

-- View all rows in new continuous aggregates Materialized View.
SELECT * FROM cagg_hourly_readings_unit;

SELECT * FROM hourly_readings_unit;