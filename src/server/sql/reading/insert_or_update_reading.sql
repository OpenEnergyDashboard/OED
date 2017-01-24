INSERT INTO readings (meter_id, reading, read_timestamp)
VALUES (${meterID}, ${reading}, ${timestamp})
  ON CONFLICT (meter_id, read_timestamp) DO UPDATE SET read_timestamp=${timestamp};