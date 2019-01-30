/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
	This function sums the readings over some short duration for some set of readings. This is then repeated until the
	short time intervals cover the total time interval that is to be shown.
 */
CREATE OR REPLACE FUNCTION barchart_readings(
		-- Declaring parameters for the function.

    meter_ids INTEGER[],
    -- Total duration to measure meters over.
    duration INTERVAL,
    from_timestamp TIMESTAMP = '-infinity',
    to_timestamp TIMESTAMP = 'infinity')
	-- Return a table containing the id, sum of readings, and interval as columns.
	RETURNS TABLE(meter_ID INTEGER, reading_sum INTEGER, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$

	-- Create some variables to hold the actual time range and duration.
	DECLARE
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
		real_duration INTERVAL;

	BEGIN
		-- Select the time of the earliest reading in the readings table and the latest and put them into the real_timestamps.
		-- TODO: Should this be changed into finding the earliest and latest for just the meters that are being looked at?
		SELECT
			greatest(MIN(readings.start_timestamp), from_timestamp), least(MAX(readings.end_timestamp), to_timestamp)
		INTO real_start_timestamp, real_end_timestamp
		FROM readings
		-- Create a temporary variable that has an attribute 'id' to match with the corresponding row in readings.
		INNER JOIN unnest(meter_ids) specific_meter(id) ON readings.meter_id = specific_meter.id
		-- Only select readings that overlap the interval we are looking for.
		WHERE (readings.start_timestamp, readings.end_timestamp) OVERLAPS (from_timestamp, to_timestamp);

		IF real_start_timestamp = '-infinity' OR real_end_timestamp = 'infinity' THEN
			-- If the time range was not shrunk then there were no readings and we should return no rows.
			RETURN; -- Return just returns an empty result set.
		END IF;

		-- If we didn't return then it's safe to subtract the timestamps
		real_duration := least(duration, real_end_timestamp - real_start_timestamp);

		RETURN QUERY
		SELECT
			r.meter_id,
			CAST(
					ROUND(SUM(
							 r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))
							 * EXTRACT(epoch FROM (least(r.end_timestamp, (agg.start + real_duration)) - greatest(r.start_timestamp, agg.start)))
					)) AS INTEGER
			),
			agg.start,
			agg.start + real_duration
		FROM readings r
		INNER JOIN unnest(meter_ids) specific_meter(id) ON r.meter_id = specific_meter.id
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp, real_duration) agg(start)
				ON
					(r.start_timestamp, r.end_timestamp) OVERLAPS (agg.start, agg.start + real_duration)
					AND -- generate_series is an end-inclusive range, so we make it an open interval with the second OVERLAPS statement
					(agg.start, agg.start + duration) OVERLAPS (real_start_timestamp, real_end_timestamp)
		GROUP BY(r.meter_id, agg.start)
		ORDER BY r.meter_id, agg.start;
	END;
	$$ LANGUAGE plpgsql;
