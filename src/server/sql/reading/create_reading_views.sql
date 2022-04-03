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
not exceed the start/end times for all the readings. This can be an issue, in particular,
because infinity is used to indicate to graph all readings.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_real_readings(tsrange_to_shrink TSRANGE)
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(start_timestamp), max(end_timestamp)) INTO readings_max_tsrange
	FROM readings;
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
min_data_points: The minimum number of data points to return if using the day view.
min_hour_points: The minimum number of data points to return if using the hour view.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
CREATE OR REPLACE FUNCTION line_meters_readings_unit(meter_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	requested_interval INTERVAL;
	requested_range TSRANGE;
	unit_column INTEGER;
BEGIN
	-- Make sure the time range is withing the reading values.
	requested_range := shrink_tsrange_to_real_readings(tsrange(start_stamp, end_stamp, '[]'));
	requested_interval := upper(requested_range) - lower(requested_range);
	-- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
	SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;

	-- For each frequency of points, verify that you will get the minimum graphing points to use.
	-- Start with the lowest frequency (daily), then hourly and then use raw/meter data if others
	-- will not work.
	IF extract(DAY FROM requested_interval) > min_day_points THEN
		-- Get daily points to graph
		RETURN QUERY
			SELECT
				daily.meter_id AS meter_id,
				-- Convert the reading based on the conversion found below.
				-- Daily readings are already averaged correctly into a rate.
				daily.reading_rate * c.slope + c.intercept as reading_rate,
				lower(daily.time_interval) AS start_timestamp,
				upper(daily.time_interval) AS end_timestamp
			FROM ((((daily_readings_unit daily
			-- Get all the meter_ids in the passed array of meters.
			INNER JOIN unnest(meter_ids) meters(id) ON daily.meter_id = meters.id)
			-- This sequence of joins takes the meter id to its unit and in the final join
			-- it then uses the unit_index for this unit.
			INNER JOIN meters m ON m.id = meters.id)
			INNER JOIN units u ON m.unit_id = u.id)
			-- This is getting the conversion for the meter (row_index) and unit to graph (column_index).
			-- The slope and intercept are used above the transform the reading to the desired unit.
			INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
			WHERE requested_range @> time_interval;
	-- There's no quick way to get the number of hours in an interval. extract(HOURS FROM '1 day, 3 hours') gives 3.
	ELSIF extract(EPOCH FROM requested_interval)/3600 > min_hour_points THEN
		-- Get hourly points to graph. See daily for more comments.
		RETURN QUERY
			SELECT hourly.meter_id AS meter_id,
				-- Convert the reading based on the conversion found below.
				-- Hourly readings are already averaged correctly into a rate.
				hourly.reading_rate * c.slope + c.intercept as reading_rate,
				lower(hourly.time_interval) AS start_timestamp,
				upper(hourly.time_interval) AS end_timestamp
			FROM ((((hourly_readings_unit hourly
			INNER JOIN unnest(meter_ids) meters(id) ON hourly.meter_id = meters.id)
			INNER JOIN meters m ON m.id = meters.id)
			INNER JOIN units u ON m.unit_id = u.id)
			INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		WHERE requested_range @> time_interval;
	 ELSE
		-- Default to raw/meter data to graph. See daily for more comments.
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
			FROM ((((readings r
			INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id)
			INNER JOIN meters m ON m.id = meters.id)
			INNER JOIN units u ON m.unit_id = u.id)
			INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		WHERE lower(requested_range) <= r.start_timestamp AND r.end_timestamp <= upper(requested_range);
	 END IF;
END;
$$ LANGUAGE 'plpgsql';


/*
The following function determines the correct duration view to query from, and returns averaged or raw readings from it.
It is designed to return data for plotting line graphs. It works on groups.
It is the new version of compressed_group_readings_2 that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
min_data_points: The minimum number of data points to return if using the day view.
min_hour_points: The minimum number of data points to return if using the hour view.
Details on how this function works can be found in the devDocs in the resource generalization document and above
in the meter function that is equivalent.
 */
CREATE OR REPLACE FUNCTION line_groups_readings_unit(group_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
	RETURNS TABLE(group_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
	DECLARE
		meter_ids INTEGER[];
	BEGIN
		-- First get all the meter ids that will be included in one or more groups being queried.
		SELECT array_agg(gdm.meter_id) INTO meter_ids
		FROM groups_deep_meters gdm
		INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

		RETURN QUERY
			SELECT
				gdm.group_id AS group_id,
				SUM(readings.reading_rate) AS reading_rate,
				readings.start_timestamp,
				readings.end_timestamp
			FROM line_meters_readings_unit(meter_ids, graphic_unit_id, start_stamp, end_stamp, min_day_points, min_hour_points) readings
			INNER JOIN groups_deep_meters gdm ON readings.meter_id = gdm.meter_id
			INNER JOIN unnest(group_ids) gids(id) on gdm.group_id = gids.id
			GROUP BY gdm.group_id, readings.start_timestamp, readings.end_timestamp;
	END;
$$ LANGUAGE 'plpgsql';


-- TODO need to update meter/group bar for units and meter types.
CREATE OR REPLACE FUNCTION compressed_barchart_readings_2(
	meter_ids INTEGER[],
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
BEGIN
	bar_width := INTERVAL '1 day' * bar_width_days;
	real_tsrange := shrink_tsrange_to_real_readings(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)));
	real_start_stamp := date_trunc_up('day', lower(real_tsrange));
	real_end_stamp := date_trunc('day', upper(real_tsrange));
	RETURN QUERY
		SELECT dr.meter_id AS meter_id,
			--  dr.reading_rate is the weighted average reading rate over the day, in kW. To convert it to kW * h,
			-- we do reading_rate (kw) * time (1 day) * (24 hr / 1 day) to get kW H.
			SUM(dr.reading_rate * 24) AS reading,
			bars.interval_start AS start_timestamp,
			bars.interval_start + bar_width AS end_timestamp
	FROM daily_readings_unit dr
	INNER JOIN generate_series(real_start_stamp, real_end_stamp, bar_width) bars(interval_start)
			ON tsrange(bars.interval_start, bars.interval_start + bar_width, '[]') @> dr.time_interval
	INNER JOIN unnest(meter_ids) meters(id) ON dr.meter_id = meters.id
	GROUP BY dr.meter_id, bars.interval_start;

END;
$$ LANGUAGE 'plpgsql';


CREATE OR REPLACE FUNCTION compressed_barchart_group_readings_2(
	group_ids INTEGER[],
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
BEGIN
	bar_width := INTERVAL '1 day' * bar_width_days;
	real_tsrange := shrink_tsrange_to_real_readings(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)));
	real_start_stamp := date_trunc_up('day', lower(real_tsrange));
	real_end_stamp := date_trunc('day', upper(real_tsrange));
	RETURN QUERY
	SELECT gdm.group_id AS group_id,
				 SUM(dr.reading_rate * 24) AS reading, -- 24 hours in a day
				 bars.interval_start AS start_timestamp,
				 bars.interval_start + bar_width AS end_timestamp
	FROM daily_readings_unit dr
		INNER JOIN generate_series(real_start_stamp, real_end_stamp, bar_width) bars(interval_start)
			ON tsrange(bars.interval_start, bars.interval_start + bar_width, '[]') @> dr.time_interval
		INNER JOIN groups_deep_meters gdm ON dr.meter_id = gdm.meter_id
		INNER JOIN unnest(group_ids) groups(id) ON gdm.group_id = groups.id
	GROUP BY gdm.group_id, bars.interval_start;
END;
$$ LANGUAGE 'plpgsql';
