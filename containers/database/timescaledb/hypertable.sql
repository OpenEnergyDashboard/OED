-- Create TimescaleDB extension.
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table to be converted into hypertable.
CREATE TABLE readings_hypertable (LIKE readings INCLUDING ALL);

-- Verify current database.
SELECT current_database();

-- Insert all rows from readings into hypertable.
INSERT INTO readings_hypertable SELECT * FROM readings;

-- View current hypertable rows.
SELECT * FROM readings_hypertable;

-- Verify counts for tables.
SELECT COUNT(*) FROM readings;
SELECT COUNT(*) FROM readings_hypertable;

-- Convert readings_hypertable to hypertable.
SELECT create_hypertable(
  'readings_hypertable',
  'start_timestamp',
  migrate_data => TRUE,
  if_not_exists => TRUE
);

-- View hypertable information.
SELECT * FROM timescaledb_information.hypertables;

-- View chunks information.
SELECT * FROM timescaledb_information.chunks;
