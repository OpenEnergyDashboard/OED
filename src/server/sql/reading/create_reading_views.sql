/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
There were issues (possibly with syntax) in where a case and an if statement
could be used. They are very similar where case seems more general.
Trying to only use case statements led to issues so the following functions
mix case and if statements.
*/

/*
Rounds a timestamp up to the next interval
 */
CREATE OR REPLACE FUNCTION date_trunc_up(interval_precision TEXT, ts TIMESTAMP)
	RETURNS TIMESTAMP LANGUAGE SQL
IMMUTABLE
AS $$
SELECT CASE
	 WHEN ts = date_trunc(interval_precision, ts) THEN ts
	 ELSE date_trunc(interval_precision, ts + ('1 ' || interval_precision)::INTERVAL)
	 END
$$;

/*
This takes tsrange_to_shrink which is the requested time range to plot and makes sure it does
not exceed the start/end times for the readings for the supplied meters. This can be an issue, in particular,
because infinity is used to indicate to graph all readings.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_real_readings(tsrange_to_shrink TSRANGE, meter_ids INTEGER[])
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(start_timestamp), max(end_timestamp)) INTO readings_max_tsrange
	FROM (readings r
		INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id);
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';

/*
This takes tsrange_to_shrink which is the requested time range to plot and makes sure it does
not exceed the start/end times for all the readings. This can be an issue, in particular,
because infinity is used to indicate to graph all readings. This version does it to the nearest
day by using the day reading view since bars use to the nearest day and this should be faster.
This should be fine since bar uses the same view to get data.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_real_readings_by_day(tsrange_to_shrink TSRANGE)
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(lower(time_interval)), max(upper(time_interval))) INTO readings_max_tsrange
	FROM daily_readings_unit;
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';

/*
	The following views are all generated in src/server/models/Reading.js in createReadingsMaterializedViews.
	This is necessary because they can't be wrapped in a function (otherwise predicates would not be pushed down).
*/

/*
The query shared by all of these views gets slow when one of two things happen:
	1) It has to scan a large percentage of the readings table
	2) It has to generate a large number of rows (by compressing to a small interval)
We pick the best of both worlds by only materializing the large duration tables (day+ and then hour+).
These produce fewer rows, making them acceptable to store,
but they benefit from materialization because they require a scan of a large percentage of
the readings table (to aggregate data over a large time range). The hourly table may not be that much smaller than
the meter data but it can make it much faster for meters that read at sub-hour intervals so it's worth the
extra disk space.

The daily and hourly views are used when they give a minimum number of points as specified by the supplied
parameter. It first tries daily since this is fastest, then hourly and finally uses raw/meter data if necessary.
The goal is that the number of readings touched is never that large and when doing raw/meter readings the
time range should be small so the number of readings retrieved is not large. It is assumed that the indices/optimizations
allow for getting a subset of the raw/meter readings quickly.
 */

/**
The next two create a view/table that takes the raw/meter readings and averages them for each day or hour.
This is used by the line graph function below to make them faster since the values
are already averaged. There are two types of readings: quantity and flow/raw. The quantity
readings must be normalized by their time length. The flow/raw readings are already by time
so they are just averaged. The one table contains both types of readings but are now equivalent
so the line reading functions can use them both in the same way.
 */
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

		-- The following code does the max/min and is commented out until the front-end supports this.
		-- CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    	-- 	(max(( --Extract the maximum rate over each day
		-- 		(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 			extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 				least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 				-
		-- 				greatest(r.start_timestamp, gen.interval_start)
		-- 			)
		-- 	)))
		-- WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
		-- 	(max(( 
		-- 		(r.reading * 3600 / u.sec_in_rate)
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	)))
		-- END as max,

		-- CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    	-- 	(min(( --Extract the minimum rate over each day
		-- 		(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	)))
		-- WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
		-- 	(min((
		-- 		(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	))) 
		-- END as min,
		
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

		-- The following code does the max/min and is commented out until the front-end supports this.
		-- CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    	-- 	(max(( -- Extract the maximum rate over each day
		-- 		(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	)))
		-- WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
		-- 	(max(( -- For flow and raw data the max/min is per minute, so we multiply the max/min by 24 hrs * 60 min
		-- 		(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	)))
		-- END as max,
			
		-- CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
		-- 	(min(( --Extract the minimum rate over each day
		-- 		(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 				least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 				-
		-- 				greatest(r.start_timestamp, gen.interval_start)
		-- 			)
		-- 	) / (
		-- 			extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 				least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 				-
		-- 				greatest(r.start_timestamp, gen.interval_start)
		-- 			)
		-- 	)))
		-- WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
		-- 	(min((
		-- 		(r.reading * 3600 / u.sec_in_rate) -- Reading rate in kw
		-- 		*
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	) / (
		-- 		extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
		-- 			least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
		-- 			-
		-- 			greatest(r.start_timestamp, gen.interval_start)
		-- 		)
		-- 	)))
		-- END as min,

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


-- TODO Check if needed and when to use as not done for hourly.
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- We need a gist index to support the @> operation.
CREATE INDEX if not exists idx_daily_readings_unit ON daily_readings_unit USING GIST(time_interval, meter_id);


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
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
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
		if (current_point_accuracy = 'auto'::reading_line_accuracy) THEN
			-- The request wants automatic calculation of the points returned.

			-- The interval of time for the requested_range.
			requested_interval := upper(requested_range) - lower(requested_range);
			-- Get the seconds in the interval.
			-- Wanted to use the INTO syntax used above but could not get it to work so using the set syntax.
			requested_interval_seconds := (SELECT * FROM EXTRACT(EPOCH FROM requested_interval));
			-- Get the frequency that this meter reads at.
			select reading_frequency into frequency FROM meters where id = current_meter_id;
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

/*
The following function determines the correct duration view to query from, and returns averaged readings from it.
It is designed to return data for plotting line graphs. It works on groups.
It is the new version of compressed_group_readings_2 that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
point_accuracy: Tells how decisions should be made on which types of points to return. 'auto' if automatic.
max_hour_points: The maximum number of data points to return if using the hour view. Only used if 'auto'/'raw' for point_accuracy.
Details on how this function works can be found in the devDocs in the resource generalization document and above
in the meter function that is equivalent.
 */
CREATE OR REPLACE FUNCTION group_line_readings_unit (
	group_ids INTEGER[],
	graphic_unit_id INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	point_accuracy reading_line_accuracy,
	max_hour_points INTEGER
)
	RETURNS TABLE(group_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	meter_ids INTEGER[];
	requested_range TSRANGE;
	requested_interval INTERVAL;
	requested_interval_seconds INTEGER;
	meters_min_frequency INTERVAL;

BEGIN
	-- First get all the meter ids that will be included in one or more groups being queried.
	-- In case meter is repeated, make this distinct.
	SELECT array_agg(DISTINCT gdm.meter_id) INTO meter_ids
	FROM groups_deep_meters gdm
	INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

	-- Calculate point accuracy if request (auto) or if raw since that is not allowed for groups.
	IF (point_accuracy = 'auto'::reading_line_accuracy OR point_accuracy = 'raw'::reading_line_accuracy) THEN
		-- The request needs automatic calculation of the points returned.

		-- Make sure the time range is within the reading values for meters in this group.
		requested_range := shrink_tsrange_to_real_readings(tsrange(start_stamp, end_stamp, '[]'), meter_ids);
		-- The interval of time for the requested_range.
		requested_interval := upper(requested_range) - lower(requested_range);
		-- Get the seconds in the interval.
		-- Wanted to use the INTO syntax used above but could not get it to work so using the set syntax.
		requested_interval_seconds := (SELECT * FROM EXTRACT(EPOCH FROM requested_interval));
		-- Make sure that the number of hour points is no more than maximum hourly readings.
		-- Thus, check if no more than interval in seconds / (60 seconds/minute * 60 minutes/hour) = # hours in interval.
		IF (requested_interval_seconds / 3600 <= max_hour_points) THEN
			-- Return hourly reading data.
			point_accuracy := 'hourly'::reading_line_accuracy;
		ELSE
			-- Return daily reading data.
			point_accuracy := 'daily'::reading_line_accuracy;
		END IF;

		-- Groups can require reading interpolation because of multiple meters. For example, if one meter
		-- is 30 day reading frequency then it will interpolate to hourly or daily depending other
		-- meters (if exist). However, to limit this effect, if hourly has been selected automatically,
		-- check if shortest meter reading frequency for this group is more than an hour and then
		-- choose daily instead.
		IF (point_accuracy = 'hourly'::reading_line_accuracy) THEN
			-- Find the min reading frequency for all meters in the group.
			SELECT min(reading_frequency) INTO meters_min_frequency
			FROM (meters m
			INNER JOIN unnest(meter_ids) meters(id) ON m.id = meters.id);
			IF (EXTRACT(EPOCH FROM meters_min_frequency) > 3600) THEN
				-- The smallest meter frequency is greater than 1 hour (3600 seconds) so use daily instead.
				point_accuracy = 'daily'::reading_line_accuracy;
			END IF;
		END IF;
	END IF;
	-- point_accuracy should either be daily or hourly at this point.

	RETURN QUERY
		SELECT
			gdm.group_id AS group_id,
			SUM(readings.reading_rate) AS reading_rate,
			readings.start_timestamp,
			readings.end_timestamp
		-- point_accuracy not 'auto' so last two parameters not used so send -1.
		FROM meter_line_readings_unit(meter_ids, graphic_unit_id, start_stamp, end_stamp, point_accuracy, -1, -1) readings
		INNER JOIN groups_deep_meters gdm ON readings.meter_id = gdm.meter_id
		INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id
		GROUP BY gdm.group_id, readings.start_timestamp, readings.end_timestamp
		-- This ensures the data is sorted
		ORDER BY readings.start_timestamp ASC;
END;
$$ LANGUAGE 'plpgsql';


/*
The following function returns data for plotting bar graphs. It works on meters.
It should not be used on raw readings.
It is the new version of compressed_barchart_readings_2 that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
bar_width_days: The number of days to use for the bar width.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
 */
CREATE OR REPLACE FUNCTION meter_bar_readings_unit (
	meter_ids INTEGER[],
	graphic_unit_id INTEGER,
	bar_width_days INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP
)
	RETURNS TABLE(meter_id INTEGER, reading FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	bar_width INTERVAL;
	real_tsrange TSRANGE;
	real_start_stamp TIMESTAMP;
	real_end_stamp TIMESTAMP;
	unit_column INTEGER;
	num_bars INTEGER;
BEGIN
	-- This is how wide (time interval) for each bar.
	bar_width := INTERVAL '1 day' * bar_width_days;
	/*
	This rounds to the day for the start and end times requested. It then shrinks in case the actual readings span
	less time than the request. This can commonly happen when you get +/-infinity for all readings available.
	It uses the day reading view because that is faster than using all the readings.
	This has a few issues associated with it:

	1) If the readings at the start/end have a partial day then it shows up as a day. The original code did:
	real_tsrange := shrink_tsrange_to_real_readings(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)));
	and did not have this issue since it used the readings and then truncated up/down.
	A more general solution would be to change the daily (and hourly) view so it does not include partial ones at start/end.
	This would fix this case and also impact other uses in what seems a positive way.
	Note this does not address that missing days in a bar width get no value so the bar will likely read low.

	2) This is using the max/min reading date timestamps for all meters. The issue with doing each meter separatly is that if
	they have different end times then the bars may not align. For example, if you have 7 day bars and the end time of one meter is two days
	earlier than the global max then all of its bars will be shifted two days. Since people want to compare among bars in a group, this
	was undesirable so the global values are used. It means the shifted meters may have missing days that make them smaller than the others.
	It also is needed for group bars that sum these results so they must align.
	*/
	real_tsrange := shrink_tsrange_to_real_readings_by_day(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)));
	-- Get the actual start/end time rounded to the nearest day from the range.
	real_start_stamp := lower(real_tsrange);
	real_end_stamp := upper(real_tsrange);
	-- This gives the number of whole bars that will fit within the real start/end times. For example, if the number of days
	-- between start and end is 14 days and the bar width is 3 days then you get 4.
	num_bars := floor(extract(EPOCH FROM real_end_stamp - real_start_stamp) / extract(EPOCH FROM bar_width));
	-- This makes the full bars go from the end time to as far back in time as possible.
	-- This means that if some time was dropped to get full bars it is at the start of the interval.
	-- It was felt that the most recent readings are the most important so drop older ones.
	-- It also helps with maps since they use the latest bar for their value.
	real_start_stamp := real_end_stamp - (num_bars *  bar_width);
	-- Since the inner join on the generate_series adds the bar_width, we need to back up the
	-- end timestamp by that amount so it stops at the desired end timestamp.
	real_end_stamp := real_end_stamp - bar_width;

	-- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
	SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;

	RETURN QUERY
		SELECT dr.meter_id AS meter_id,
		--  dr.reading_rate is the weighted average reading rate per hour over the day.
		-- Convert to a quantity by multiplying by the time in hours which is 24 since daily values.
		-- Then convert the reading based on the conversion found below.
		SUM(dr.reading_rate * 24) * c.slope + c.intercept AS reading,
		bars.interval_start AS start_timestamp,
		bars.interval_start + bar_width AS end_timestamp
		FROM (((((daily_readings_unit dr
		INNER JOIN generate_series(real_start_stamp, real_end_stamp, bar_width) bars(interval_start)
				ON tsrange(bars.interval_start, bars.interval_start + bar_width, '[]') @> dr.time_interval)
		-- Get all the meter_ids in the passed array of meters.
		INNER JOIN unnest(meter_ids) meters(id) ON dr.meter_id = meters.id)
		-- This sequence of joins takes the meter id to its unit and in the final join
		-- it then uses the unit_index for this unit.
		INNER JOIN meters m ON m.id = meters.id)
		-- Don't return bar data if raw since cannot sum.
		INNER JOIN units u ON m.unit_id = u.id AND u.unit_represent != 'raw'::unit_represent_type)
		-- This is getting the conversion for the meter (row_index) and unit to graph (column_index).
		-- The slope and intercept are used above the transform the reading to the desired unit.
		INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		GROUP BY dr.meter_id, bars.interval_start, c.slope, c.intercept;
END;
$$ LANGUAGE 'plpgsql';


/*
The following function returns data for plotting bar graphs. It works on groups.
It should not be used on raw readings.
It is the new version of compressed_barchart_group_readings_2 that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
bar_width_days: The number of days to use for the bar width.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
 */
CREATE OR REPLACE FUNCTION group_bar_readings_unit (
	group_ids INTEGER[],
	graphic_unit_id INTEGER,
	bar_width_days INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP
)
	RETURNS TABLE(group_id INTEGER, reading FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	bar_width INTERVAL;
	real_tsrange TSRANGE;
	real_start_stamp TIMESTAMP;
	real_end_stamp TIMESTAMP;
	meter_ids INTEGER[];
BEGIN
	-- First get all the meter ids that will be included in one or more groups being queried.
	SELECT array_agg(DISTINCT gdm.meter_id) INTO meter_ids
	FROM groups_deep_meters gdm
	INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

	RETURN QUERY
		SELECT
			gdm.group_id AS group_id,
			SUM(readings.reading) AS reading,
			readings.start_timestamp,
			readings.end_timestamp
		FROM meter_bar_readings_unit(meter_ids, graphic_unit_id, bar_width_days, start_stamp, end_stamp) readings
		INNER JOIN groups_deep_meters gdm ON readings.meter_id = gdm.meter_id
		INNER JOIN unnest(group_ids) gids(id) on gdm.group_id = gids.id
		GROUP BY gdm.group_id, readings.start_timestamp, readings.end_timestamp;
END;
$$ LANGUAGE 'plpgsql';
