/*
 * Drop the TimescaleDB reading continuous aggregates in reverse dependency
 * order. The daily aggregate depends on the hourly aggregate, so it must be
 * removed first.
 */
DROP MATERIALIZED VIEW IF EXISTS meter_daily_readings_unit_cagg;
DROP MATERIALIZED VIEW IF EXISTS meter_hourly_readings_unit_cagg;
