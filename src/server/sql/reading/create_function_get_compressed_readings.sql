/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
	This function compresses the readings for an array of meters over a given date range to a given number of even intervals, and
	returns a query
 */
CREATE OR REPLACE FUNCTION compressed_readings(
	meter_ids INTEGER[],
	-- All readings between these timestamps from the above meters will be compressed.
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity',
	-- Number of points to make out of the compression.
	num_points INT = 500)
	-- Return a table with the id and reading info.
	RETURNS TABLE(meter_ID INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	-- Create some variables to hold how wide each point will be in time and when the readings actually start and end.
	DECLARE
		point_width INTERVAL;
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
	BEGIN
		/*
		Shrink our region so that it starts at either the beginning of the first eligible reading if it is later than the
		beginning of the reading range or at from_timestamp if there are readings before our timestamp that overlap it.
		The same is done for where our region ends.
		*/
		SELECT
			-- Select the beginning of the time range or the beginning of the first overlapping reading.
			greatest(MIN(readings.start_timestamp), from_timestamp), least(MAX(readings.end_timestamp), to_timestamp)
		INTO real_start_timestamp, real_end_timestamp
		FROM readings
			-- We do WHERE readings.end_timestamp >= from_timestamp to catch readings that hang off the left end of our range.
			-- Likewise with readings.start_timestamp <= to_timestamp
		WHERE readings.meter_id = ANY(meter_ids)
					AND readings.end_timestamp >= from_timestamp AND readings.start_timestamp <= to_timestamp;

		IF real_start_timestamp = '-infinity' OR real_end_timestamp = 'infinity' THEN
			-- If the time range was not shrunk then there were no readings and we should return no rows.
			RETURN; -- Return just returns an empty result set.
		END IF;

		-- If we didn't return then it's safe to subtract the timestamps
		point_width := (real_end_timestamp - real_start_timestamp) / num_points;

		RETURN QUERY
		WITH readings_by_compression_point AS (
			SELECT
				r.meter_id,
				/*
					This assumes that any readings are in kWh, and divides them by the number of hours in the interval to get
					readings in kW. It gets the number of hours by dividing the number of seconds by 3600.
				*/
				r.reading / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600) AS reading_kw,
				compressed.start AS reading_start,
				-- Get the total duration of the compressed readings by finding the difference between (either the end of the
				-- time range or the end of the point) and (the start of the time range or the start of the point).
				EXTRACT(EPOCH FROM least(r.end_timestamp, compressed.start + point_width) - greatest(r.start_timestamp, compressed.start)) AS duration
			FROM readings r
			-- Iterate over a series starting from the beginning of the time range to the end of the time range.
			-- 'point_width' is subtracted since pgsql makes series end inclusive so we want to ignore the last point.
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp - point_width, point_width) compressed(start) ON
					-- Select only those readings that overlap the start time of the point to compress on.
					r.start_timestamp <= compressed.start + point_width AND r.end_timestamp >= compressed.start
			WHERE r.meter_id = ANY(meter_ids)
		)
		SELECT
			r.meter_id,
			-- Do a weighted sum over each readings value and duration in the compression point's range.
			sum(r.reading_kw * r.duration) / sum(r.duration) AS reading_rate,
			r.reading_start AS start_timestamp,
			r.reading_start + point_width AS end_timestamp
		FROM readings_by_compression_point r
		GROUP BY r.meter_id,  r.reading_start ORDER BY r.meter_id, r.reading_start ASC;
	END;
	$$ LANGUAGE plpgsql;
