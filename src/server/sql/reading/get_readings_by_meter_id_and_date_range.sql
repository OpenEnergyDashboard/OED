SELECT
  meter_id, reading, start_timestamp, end_timestamp
FROM readings
WHERE meter_id = ${meterID}
  AND start_timestamp >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
	AND end_timestamp <= COALESCE(${endDate}, 'infinity'::TIMESTAMP);
