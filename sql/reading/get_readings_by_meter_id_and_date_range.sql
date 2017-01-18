-- Coalesce returns the first non-null value
SELECT
  meter_id, reading, read_timestamp
FROM readings
WHERE meter_id = ${meterID}
  AND read_timestamp BETWEEN
    COALESCE(${startDate}, DATE '1970-01-01')
    AND COALESCE(${endDate}, DATE '50000-01-01');