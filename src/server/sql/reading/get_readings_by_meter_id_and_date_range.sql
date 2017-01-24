SELECT
  meter_id, reading, read_timestamp
FROM readings
WHERE meter_id = ${meterID}
  AND read_timestamp BETWEEN
  -- Coalesce returns the first non-null value, so this defaults the start date to 1970 and end to 50000,
  -- effectively not restricting them
    COALESCE(${startDate}, DATE '1970-01-01')
    AND COALESCE(${endDate}, DATE '50000-01-01');
