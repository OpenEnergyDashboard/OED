/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


-- Drop view since exists and only create
DROP MATERIALIZED VIEW IF EXISTS daily_readings_unit;

CREATE MATERIALIZED VIEW IF NOT EXISTS
daily_readings_unit
	AS SELECT
		-- This gives the weighted average of the reading rates, defined as
		-- sum(reading_rate * overlap_duration) / sum(overlap_duration)
		r.meter_id AS meter_id,
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
			(sum(
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / sum(
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(sum(
				(r.reading * 3600 / u.sec_in_rate) -- Reading rate in per hour
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / sum(
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			))
		END AS reading_rate,

		-- The following code does the min/max for daily readings
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    		(max(( --Extract the maximum rate over each day
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
						least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
						-
						greatest(r.start_timestamp, gen.interval_start)
					)
			)))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(max(( 
				(r.reading * 3600 / u.sec_in_rate)
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			)))
		END as max_rate,

		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    		(min(( --Extract the minimum rate over each day
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			)))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(min((
				(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			))) 
		END as min_rate,
		
	tsrange(gen.interval_start, gen.interval_start + '1 day'::INTERVAL, '()') AS time_interval
	FROM ((readings r
	-- This sequence of joins takes the meter id to its unit and in the final join
	-- it then uses the unit_index for this unit.
	INNER JOIN meters m ON r.meter_id = m.id)
	INNER JOIN units u ON m.unit_id = u.id)
		CROSS JOIN LATERAL generate_series(
			date_trunc('day', r.start_timestamp),
			-- Subtract 1 interval width because generate_series is end-inclusive
			date_trunc_up('day', r.end_timestamp) - '1 day'::INTERVAL,
			'1 day'::INTERVAL
		) gen(interval_start)
	GROUP BY r.meter_id, gen.interval_start, u.unit_represent
	-- The order by ensures that the materialized view will be clustered in this way.
	ORDER BY gen.interval_start, r.meter_id;


-- Drop view since exists and only create
DROP MATERIALIZED VIEW IF EXISTS hourly_readings_unit;

CREATE MATERIALIZED VIEW IF NOT EXISTS
hourly_readings_unit
	AS SELECT
		-- This gives the weighted average of the reading rates, defined as
		-- sum(reading_rate * overlap_duration) / sum(overlap_duration)
		r.meter_id AS meter_id,
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
			(sum(
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
						-
						greatest(r.start_timestamp, gen.interval_start)
				)
			) / sum(
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(sum(
				(r.reading * 3600 / u.sec_in_rate) -- Reading rate in per hour
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / sum(
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
						least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
						-
						greatest(r.start_timestamp, gen.interval_start)
					)
			))
		END AS reading_rate,

		-- The following code does the min/max for hourly readings
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    		(max(( -- Extract the maximum rate over each day
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			)))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(max(( -- For flow and raw data the max/min is per minute, so we multiply the max/min by 24 hrs * 60 min
				(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			)))
		END as max_rate,
			
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
			(min(( --Extract the minimum rate over each day
				(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
						least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
						-
						greatest(r.start_timestamp, gen.interval_start)
					)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
						least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
						-
						greatest(r.start_timestamp, gen.interval_start)
					)
			)))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(min((
				(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			) / (
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
					least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
					-
					greatest(r.start_timestamp, gen.interval_start)
				)
			)))
		END as min_rate,

	tsrange(gen.interval_start, gen.interval_start + '1 hour'::INTERVAL, '()') AS time_interval
	FROM ((readings r
	-- This sequence of joins takes the meter id to its unit and in the final join
	-- it then uses the unit_index for this unit.
	INNER JOIN meters m ON r.meter_id = m.id)
	INNER JOIN units u ON m.unit_id = u.id)
		CROSS JOIN LATERAL generate_series(
			date_trunc('hour', r.start_timestamp),
			-- Subtract 1 interval width because generate_series is end-inclusive
			date_trunc_up('hour', r.end_timestamp) - '1 hour'::INTERVAL,
			'1 hour'::INTERVAL
		) gen(interval_start)
	GROUP BY r.meter_id, gen.interval_start, u.unit_represent
	-- The order by ensures that the materialized view will be clustered in this way.
	ORDER BY gen.interval_start, r.meter_id;


-- Must first drop function since the signature changed.
DROP FUNCTION meter_line_readings_unit(integer[],integer,timestamp without time zone,timestamp without time zone,reading_line_accuracy,integer,integer);
/*
The following function determines the correct duration view to query from, and returns averaged or raw reading from it.
It is designed to return data for plotting line graphs. It works on meters.
It is the new version of compressed_readings_2 that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graphic.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
point_accuracy: Tells how decisions should be made on which types of points to return. 'auto' if automatic.
max_raw_points: The maximum number of data points to return if using the raw points for a meter. Only used if 'auto' for point_accuracy.
max_hour_points: The maximum number of data points to return if using the hour view. Only used if 'auto' for point_accuracy.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
CREATE OR REPLACE FUNCTION meter_line_readings_unit (
	meter_ids INTEGER[],
	graphic_unit_id INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	point_accuracy reading_line_accuracy,
	max_raw_points INTEGER,
	max_hour_points INTEGER
)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, min_rate FLOAT, max_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	requested_range TSRANGE;
	requested_interval INTERVAL;
	requested_interval_seconds INTEGER;
	unit_column INTEGER;
	frequency INTERVAL;
	frequency_seconds INTEGER;
	-- Which index of the meter_id array you are currently working on.
	current_meter_index INTEGER := 1;
	-- The id of the meter index working on
	current_meter_id INTEGER;
	-- Holds accuracy for current meter.
	current_point_accuracy reading_line_accuracy;
	BEGIN
	-- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
	SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;
	-- For each frequency of points, verify that you will get the minimum graphing points to use for each meter.
	-- Start with the raw, then hourly and then daily if others will not work.
	-- Loop over all meters.
	WHILE current_meter_index <= cardinality(meter_ids) LOOP
		-- Reset the point accuracy for each meter so it does what is desired.
		current_point_accuracy := point_accuracy;
		current_meter_id := meter_ids[current_meter_index];
		-- Make sure the time range is within the reading values for this meter.
		-- There may be a better way to create the array with one element as last argument.
		requested_range := shrink_tsrange_to_real_readings(tsrange(start_stamp, end_stamp, '[]'), array_append(ARRAY[]::INTEGER[], current_meter_id));
		IF (current_point_accuracy = 'auto'::reading_line_accuracy) THEN
			-- The request wants automatic calculation of the points returned.

			-- The request_range will still be infinity if there is no meter data. This causes the
			-- auto calculation to fail because you cannot subtract them.
			-- Just check the upper range since simpler.
			IF (upper(requested_range) = 'infinity') THEN
				-- We know there is no data but easier to just let a query happen since fast.
				-- Do daily since that should be the fastest due to the least data in most cases.
				current_point_accuracy := 'daily'::reading_line_accuracy;
			ELSE
				-- The interval of time for the requested_range.
				requested_interval := upper(requested_range) - lower(requested_range);
				-- Get the seconds in the interval.
				-- Wanted to use the INTO syntax used above but could not get it to work so using the set syntax.
				requested_interval_seconds := (SELECT * FROM EXTRACT(EPOCH FROM requested_interval));
				-- Get the frequency that this meter reads at.
				SELECT reading_frequency INTO frequency FROM meters WHERE id = current_meter_id;
				-- Get the seconds in the frequency.
				frequency_seconds := (SELECT * FROM EXTRACT(EPOCH FROM frequency));

				-- The first part is making sure that there are no more than maximum raw readings to graph if use raw readings.
				-- Divide the time being graphed by the frequency of reading for this meter to get the number of raw readings.
				-- The second part checks if the frequency of raw readings is more than a day and use raw if this is the case
				-- because even daily would interpolate points. 1 day is 24 hours * 60 minute/hour * 60 seconds/minute = 86400 seconds.
				-- This can lead to too many points but do this for now since that is unlikely as you would need around 4+ years of data.
				-- Note this overrides the max raw points if it applies.
				IF ((requested_interval_seconds / frequency_seconds <= max_raw_points) OR (frequency_seconds >= 86400)) THEN
					-- Return raw meter data.
					current_point_accuracy := 'raw'::reading_line_accuracy;
				-- The first part is making sure that the number of hour points is no more than maximum hourly readings.
				-- Thus, check if no more than interval in seconds / (60 seconds/minute * 60 minutes/hour) = # hours in interval.
				-- The second part is making sure that the frequency of reading is an hour or less (3600 seconds)
				-- so you don't interpolate points by using the hourly data.
				ELSIF ((requested_interval_seconds / 3600 <= max_hour_points) AND (frequency_seconds <= 3600)) THEN
					-- Return hourly reading data.
					current_point_accuracy := 'hourly'::reading_line_accuracy;
				ELSE
					-- Return daily reading data.
					current_point_accuracy := 'daily'::reading_line_accuracy;
				END IF;
			END IF;
		END IF;
		-- At this point current_point_accuracy should never be 'auto'.

		IF (current_point_accuracy = 'raw'::reading_line_accuracy) THEN
			-- Gets raw meter data to graph.
			RETURN QUERY
				SELECT r.meter_id as meter_id,
				CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
					-- If it is quantity readings then need to convert to rate per hour by dividing by the time length where
					-- the 3600 is needed since EPOCH is in seconds.
					((r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) * c.slope + c.intercept) 
				WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
					-- If it is flow or raw readings then it is already a rate so just convert it but also need to normalize
					-- to per hour.
					((r.reading * 3600 / u.sec_in_rate) * c.slope + c.intercept)
				END AS reading_rate,
				-- There is no range of values on raw/meter data so return NaN to indicate that.
				-- The route will return this as null when it shows up in Redux state.
				cast('NaN' AS DOUBLE PRECISION) AS min_rate,
				cast('NaN' AS DOUBLE PRECISION) as max_rate,
				r.start_timestamp,
				r.end_timestamp
				FROM (((readings r
				INNER JOIN meters m ON m.id = current_meter_id)
				INNER JOIN units u ON m.unit_id = u.id)
				INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
				WHERE lower(requested_range) <= r.start_timestamp AND r.end_timestamp <= upper(requested_range) AND r.meter_id = current_meter_id
				-- This ensures the data is sorted
				ORDER BY r.start_timestamp ASC;
		-- The first part is making sure that the number of hour points is 1440 or less.
		-- Thus, check if no more than 1440 hours * 60 minutes/hour * 60 seconds/hour = 5184000 seconds.
		-- The second part is making sure that the frequency of reading is an hour or less (3600 seconds)
		-- so you don't interpolate points by using the hourly data.
		ELSIF (current_point_accuracy = 'hourly'::reading_line_accuracy) THEN
			-- Get hourly points to graph. See daily for more comments.
			RETURN QUERY
				SELECT hourly.meter_id AS meter_id,
					-- Convert the reading based on the conversion found below.
					-- Hourly readings are already averaged correctly into a rate.
					hourly.reading_rate * c.slope + c.intercept as reading_rate,
					hourly.min_rate * c.slope + c.intercept AS min_rate,
					hourly.max_rate * c.slope + c.intercept AS max_rate,
					lower(hourly.time_interval) AS start_timestamp,
					upper(hourly.time_interval) AS end_timestamp
				FROM (((hourly_readings_unit hourly
				INNER JOIN meters m ON m.id = current_meter_id)
				INNER JOIN units u ON m.unit_id = u.id)
				INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
				WHERE requested_range @> time_interval AND hourly.meter_id = current_meter_id
				-- This ensures the data is sorted
				ORDER BY start_timestamp ASC;
		ELSE
			-- Get daily points to graph. This should be an okay number but can be too many
			-- if there are a lot of days of readings.
			-- TODO Someday consider averaging days if too many.
			RETURN QUERY
				SELECT
					daily.meter_id AS meter_id,
					-- Convert the reading based on the conversion found below.
					-- Daily readings are already averaged correctly into a rate.
					daily.reading_rate * c.slope + c.intercept as reading_rate,
					daily.min_rate * c.slope + c.intercept AS min_rate,
					daily.max_rate * c.slope + c.intercept AS max_rate,
					lower(daily.time_interval) AS start_timestamp,
					upper(daily.time_interval) AS end_timestamp
				FROM (((daily_readings_unit daily
				-- Get all the meter_ids in the passed array of meters.
				-- This sequence of joins takes the meter id to its unit and in the final join
				-- it then uses the unit_index for this unit.
				INNER JOIN meters m ON m.id = current_meter_id)
				INNER JOIN units u ON m.unit_id = u.id)
				-- This is getting the conversion for the meter (row_index) and unit to graph (column_index).
				-- The slope and intercept are used above the transform the reading to the desired unit.
				INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
				WHERE requested_range @> time_interval AND daily.meter_id = current_meter_id
				-- This ensures the data is sorted
				ORDER BY start_timestamp ASC;
		END IF;
		current_meter_index := current_meter_index + 1;
	END LOOP;
END;
$$ LANGUAGE 'plpgsql';
