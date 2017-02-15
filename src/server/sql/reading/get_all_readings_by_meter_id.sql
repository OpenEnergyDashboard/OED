SELECT
  meter_id, reading, start_timestamp, end_timestamp
FROM readings
WHERE meter_id = ${meterID};
