/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
	This function compresses the readings for a meter over a given date range to a given number of even intervals, and
	returns a query
 */
CREATE OR REPLACE FUNCTION compressed_readings(
	meter_ids INTEGER[],
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity',
	num_points INT = 500)
	RETURNS TABLE(meter_ID INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		point_width INTERVAL;
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
	BEGIN
		/*
			Shrink our region so that it starts at either the beginning of the first eligible reading or from_timestamp's place
			if it intersects that reading, and ends at the end of the last eligible reading or to_timestamp's place in that reading
			if it falls inside that range.
		*/
		SELECT
			greatest(MIN(readings.start_timestamp), from_timestamp), least(MAX(readings.end_timestamp), to_timestamp)
		INTO real_start_timestamp, real_end_timestamp
		FROM readings
			-- We do WHERE readings.end_timestamp >= from_timestamp to catch readings that hang off the left end of our range.
			-- Likewise with readings.start_timestamp <= to_timestamp
		WHERE readings.meter_id = ANY(meter_ids)
					AND readings.end_timestamp >= from_timestamp AND readings.start_timestamp <= to_timestamp;

		point_width := (real_end_timestamp - real_start_timestamp) / num_points;

		RETURN QUERY
		WITH readings_by_compression_point AS (
			SELECT
				r.meter_id,
				/*
					This assumes that any readings are in kWh, and divides them by the number of hours in the interval to get
					readings in kW. It gets the number of hours by dividing the number of seconds by 3600.
				*/
				r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600) AS reading_kw,
				compressed.start AS reading_start,
				extract(EPOCH FROM least(r.end_timestamp, compressed.start + point_width) - greatest(r.start_timestamp, compressed.start)) AS duration
			FROM readings r
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp - point_width, point_width) compressed(start) ON
					r.start_timestamp <= compressed.start + point_width AND r.end_timestamp >= compressed.start
			WHERE r.meter_id = ANY(meter_ids)
		)
		SELECT
			r.meter_id,
			sum(r.reading_kw * r.duration) / sum(r.duration) AS reading_rate,
			r.reading_start AS start_timestamp,
			r.reading_start + point_width AS end_timestamp
		FROM readings_by_compression_point r
		GROUP BY r.meter_id,  r.reading_start ORDER BY r.meter_id, r.reading_start ASC;
	END;
	$$ LANGUAGE plpgsql;
