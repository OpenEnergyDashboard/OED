/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
The next two create a view/table that takes the raw/meter readings and averages them for each day or hour.
This is used by the two line graph functions below to make them faster since the values
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


/*
The following function determines the correct duration view to query from, and returns averged or raw readings from it.
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
CREATE OR REPLACE FUNCTION meter_line_readings_unit(meter_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	requested_interval INTERVAL;
	requested_range TSRANGE;
	unit_column INTEGER;
BEGIN
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
				-- If it is flow or raw readings then it is already a rate so just convert it.
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
The following function determines the correct duration view to query from, and returns averaged or raw reading from it.
It is designed to return data for plotting line graphs. It works on groups.
It is the new version of compressed_group_readings_2 that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
min_data_points: The minimum number of data points to return if using the day view.
min_hour_points: The minimum number of data points to return if using the hour view.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
CREATE OR REPLACE FUNCTION group_line_readings_unit(group_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
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
			FROM meter_line_readings_unit(meter_ids, graphic_unit_id, start_stamp, end_stamp, min_day_points, min_hour_points) readings
			INNER JOIN groups_deep_meters gdm ON readings.meter_id = gdm.meter_id
			INNER JOIN unnest(group_ids) gids(id) on gdm.group_id = gids.id
			GROUP BY gdm.group_id, readings.start_timestamp, readings.end_timestamp;
	END;
$$ LANGUAGE 'plpgsql';
