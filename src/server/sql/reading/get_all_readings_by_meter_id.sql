SELECT
  meter_id, reading, read_timestamp
FROM readings
WHERE meter_id = ${meterID};