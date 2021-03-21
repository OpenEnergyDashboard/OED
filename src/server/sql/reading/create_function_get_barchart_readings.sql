/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
	This function sums the readings for an array of meters over a given duration that is repeated over a given time interval,
	and	returns a query
 */
CREATE OR REPLACE FUNCTION barchart_readings(
	meter_ids INTEGER[],
	-- Interval that is aggregated over.
	duration INTERVAL,
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity')
	-- Return a table containing the id, sum of readings, and interval that has been aggregated as columns.
	RETURNS TABLE(meter_ID INTEGER, reading_sum INTEGER, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	-- Create some variables to hold the actual time range and duration.
	DECLARE
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
		real_duration INTERVAL;
	BEGIN
		/*
			Select either the time of the earliest reading in the time range or if there are readings earlier than the
			beginning of our time range, choose the beginning of the time range.
			The same is done for the end timestamp.
		 */
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

		-- If we didn't return then it's safe to subtract the timestamps.
		-- Get the actual amount of time to look over.
		real_duration := least(duration, real_end_timestamp - real_start_timestamp);

		RETURN QUERY
		SELECT
			r.meter_id,
			CAST(
					-- Convert the weighted average of the meter's readings from agg.start -> agg.start + real_duration to an integer.
					-- Do a weighted average of all the readings in the duration agg.start -> agg.start + real_duration.
					ROUND(SUM(
							-- Divide the value of the reading by the number of seconds the reading covered.
							 r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))
							-- Get amount of time this reading overlaps the current time segment.
							 * EXTRACT(epoch FROM (least(r.end_timestamp, (agg.start + real_duration)) - greatest(r.start_timestamp, agg.start)))
					)) AS INTEGER
			),
			-- Hold the start and end times of the reading duration segment.
			agg.start,
			agg.start + real_duration
		FROM readings r
		-- Use all readings from meters that have an id in the meter_ids array.
		INNER JOIN unnest(meter_ids) specific_meter(id) ON r.meter_id = specific_meter.id
			-- Create an array to iterate over. agg (which is short for aggregation) will hold the start of the interval to
			-- aggregate over.
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp, real_duration) agg(start)
				ON
					-- Select a reading only if it is overlapping the current aggregation interval.
					(r.start_timestamp, r.end_timestamp) OVERLAPS (agg.start, agg.start + real_duration)
					AND
					-- generate_series is an end-inclusive range (meaning at some point agg.start = real_end_timestamp)
					--  so we make it an open interval with the second OVERLAPS statement since
					-- (real_end, real_end + duration) does not overlap (real_start, real_end).
					(agg.start, agg.start + duration) OVERLAPS (real_start_timestamp, real_end_timestamp)
		-- Group the query so that all readings from a single meter are nearby and then by all aggregations that are over
		-- the same interval.
		GROUP BY(r.meter_id, agg.start)
		ORDER BY r.meter_id, agg.start;
	END;
	$$ LANGUAGE plpgsql;
