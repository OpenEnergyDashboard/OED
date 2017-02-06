CREATE FUNCTION compressed_readings(
	meter_id INTEGER,
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity',
	num_points INT = 500)
	RETURNS TABLE(reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		point_width INTERVAL;
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
	BEGIN
		/*
			Shrink our region so that it starts at the beginning of the first eligible reading and ends at the end of the last
			one.
		*/
		SELECT
			MIN(readings.start_timestamp), MAX(readings.end_timestamp)
		INTO real_start_timestamp, real_end_timestamp
		FROM readings
		WHERE readings.meter_id = $1 AND readings.start_timestamp >= $2 AND readings.end_timestamp <= $3;

		point_width := (real_end_timestamp - real_start_timestamp) / num_points;

		RETURN QUERY
		WITH readings_by_compression_point AS (
			SELECT
				/*
					This assumes that any readings are in kWh, and divides them by the number of hours in the interval to get
					readings in kW. It gets the number of hours by dividing the number of seconds by 3600.
				*/
				r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600) AS reading_kw,
				compressed.start AS reading_start,
				extract(EPOCH FROM least(r.end_timestamp, compressed.start + point_width) - greatest(r.start_timestamp, compressed.start)) AS duration
			FROM readings r
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp, point_width) compressed(start) ON
						(r.start_timestamp, r.end_timestamp) OVERLAPS (compressed.start, compressed.start + point_width)
		)
		SELECT
			sum(r.reading_kw * r.duration) / sum(r.duration) AS reading_rate,
			r.reading_start AS start_timestamp,
			r.reading_start + point_width AS end_timestamp
		FROM readings_by_compression_point r
		GROUP BY r.reading_start;
	END;
	$$ LANGUAGE plpgsql;
