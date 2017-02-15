INSERT INTO readings (meter_id, reading, start_timestamp, end_timestamp)
VALUES (${meterID}, ${reading}, ${startTimestamp}, ${endTimestamp})
		-- TODO: Deal with conflicts due to overlapping date ranges here.
  ON CONFLICT (meter_id, start_timestamp) DO UPDATE SET reading=${reading};
