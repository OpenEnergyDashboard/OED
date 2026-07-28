/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 /*
This takes tsrange_to_shrink which is the requested time range to plot and makes sure it does
not exceed the start/end times for the readings in the supplied meter. This can be an issue, in particular,
because infinity is used to indicate to graph all readings. This version does it to the nearest
day by using the day reading view and is used by 3D readings which only allow days and a single meter.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_meter_readings_by_day(tsrange_to_shrink TSRANGE, meter_id_desired INTEGER)
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(bucket), max(bucket + INTERVAL '1 day')) INTO readings_max_tsrange
	FROM meter_daily_readings_unit_cagg
	where meter_id = meter_id_desired;
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';

/* Similar to meter version but for a group */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_group_readings_by_day(tsrange_to_shrink TSRANGE, group_id_desired INTEGER)
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(bucket), max(bucket + INTERVAL '1 day')) INTO readings_max_tsrange
	FROM group_daily_readings_unit_cagg
	where group_id = group_id_desired;
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';

-- Determines the spacing between 3D points. It uses the lowest valid spacing
-- for all requested meters.
CREATE OR REPLACE FUNCTION reading_interval_3d (
	IN meter_ids_requested INTEGER[],
	IN reading_length_hours INTEGER,
	OUT reading_length_hours_use INTEGER,
	OUT reading_length_interval INTERVAL
)
AS $$
DECLARE
	meter_frequency INTERVAL;
	meter_frequency_hour_up INTEGER;
	max_frequency INTEGER;
BEGIN
	SELECT min(reading_frequency) INTO meter_frequency
	FROM meters m
	INNER JOIN unnest(meter_ids_requested) meters(id) ON m.id = meters.id;

	meter_frequency_hour_up := CEIL(EXTRACT(EPOCH FROM meter_frequency) / 3600);
	max_frequency := GREATEST(meter_frequency_hour_up, reading_length_hours);

	IF (max_frequency = 5) THEN
		reading_length_hours_use := 6;
	ELSIF (max_frequency = 7) THEN
		reading_length_hours_use := 8;
	ELSIF (max_frequency > 8 AND max_frequency < 12) THEN
		reading_length_hours_use := 12;
	ELSE
		reading_length_hours_use := max_frequency;
	END IF;

	reading_length_interval := (reading_length_hours_use::TEXT || ' hour')::INTERVAL;
END;
$$ LANGUAGE 'plpgsql';

-- Gets meters graphing data for 3D graphic by returning points that span the requested
-- length of time over the days requested.
-- New meter_3d_readings_unit function that uses new meter_hourly_readings_unit_cagg view.
CREATE OR REPLACE FUNCTION meter_3d_readings_unit (
	-- The desired meter ids. It is normally a single value for a 3D graphic.
	-- TODO Should the array be changed to a single value as with group? Need to be sure client never asks for multiple.
	meter_ids_requested INTEGER[],
	-- The desired graphic unit of the returned data
	graphic_unit_id_requested INTEGER,
	-- The start and end time for the data to return
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	-- The number of hours in each reading requested
	reading_length_hours INTEGER
)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	-- Holds the range of dates for returned data that fits the actual data.
	requested_range TSRANGE;
	-- The number of hours in each reading determined as an interval
	reading_length_interval INTERVAL;
	-- Which index of the meter_id array you are currently working on.
	current_meter_index INTEGER := 1;
	-- The id of the meter index working on
	current_meter_id INTEGER;
	-- The meter frequency from all meters.
 	meter_frequency INTERVAL;
	-- The meter frequency rounded up to a whole number of hours.
   	meter_frequency_hour_up INTEGER;
	-- The larger of the meter value and the argument sent.
	max_frequency INTEGER;
	-- The number of hours in each reading determined
	reading_length_hours_use INTEGER;
BEGIN
	-- Find the correct number of hours per reading returned.
	SELECT * from reading_interval_3d(meter_ids_requested, reading_length_hours) into reading_length_hours_use, reading_length_interval;

	-- Loop over all meters.
	WHILE current_meter_index <= cardinality(meter_ids_requested) LOOP
		-- ID of the current meter in loop
		current_meter_id := meter_ids_requested[current_meter_index];

		-- Get the range of days requested by calling shrink_tsrange_to_meter_readings_by_day.
		-- First make requested range only be full days by dropping any partial days at start/end.
		requested_range := shrink_tsrange_to_meter_readings_by_day(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)), current_meter_id);

		IF (reading_length_hours_use <= 12) THEN
			-- Need to generate_series to group the desired hours together
			RETURN QUERY
				-- The readings are rates in the hourly table so want to average not sum so
				-- work for quantity, flow & raw.
				-- The time starts at the time of the generated sequence and ends at the length
				-- of each block later. This is the same as the start time of the next value
				-- in the sequence (except last one).
				SELECT
					-- Modified to retrieve converted hourly readings from the materialized view.
					mhr.meter_id as meter_id,
					AVG(mhr.reading_rate) as reading_rate,
					hours.hour AS start_timestamp,
					hours.hour + reading_length_interval  AS end_timestamp
				-- This is the series that starts at the beginning of the desired days,
				-- ends at the end of the desired days and steps by the desired interval.
				-- You need to subtract from the last interval for the end since generate_series
				-- is inclusive.
				FROM (
					SELECT hour
					FROM generate_series(
						lower(requested_range),
						upper(requested_range) - reading_length_interval,
						reading_length_interval
					) hours(hour)
				) hours(hour),
				-- Also need the values in the meter hourly table.
				meter_hourly_readings_unit_cagg mhr
				-- Only want the desired meter
				WHERE mhr.meter_id = current_meter_id
				-- Only want the desired graphing unit
				AND mhr.graphic_unit_id = graphic_unit_id_requested
				-- Only want readings that lie within this slice of the desired data
				AND mhr.bucket >= hours.hour
				AND mhr.bucket <= hours.hour + reading_length_interval - INTERVAL '1 hour'
				-- Group by the start time of the generated series since all points in
				-- the desired slice have the same start time for the series.
				-- Also group by the meter_id since Postgres wants and desired for graphing
				GROUP BY hours.hour, mhr.meter_id
				-- Time sort by the meter and start time for graphing.
				ORDER BY mhr.meter_id, hours.hour
			;
		ELSE
			-- The reading rate is more than 12 so return a single row with dummy values that easy to detect.
			-- The end time differs from the start time by the meter reading frequency or min one for groups.
			-- This means the meter reading frequency is too long for a 3D graphic.
			RETURN QUERY
				SELECT -999, -999::FLOAT, '1900-01-01 00:00:00'::TIMESTAMP, '1900-01-01 00:00:00'::TIMESTAMP + reading_length_interval
			;
		END IF;

		-- Go to the next meter
		current_meter_index := current_meter_index + 1;
	END LOOP;
END;
$$ LANGUAGE plpgsql;

/* Gets group graphing data for 3D graphic by returning points that span the requested
  length of time over the days requested.
*/
CREATE OR REPLACE FUNCTION group_3d_readings_unit (
	--Desire group ID
	--For 3D graphics, users will only be able to select 1 group to graph.
	group_id_requested INTEGER,
	-- The desired graphic unit of the returned data
	graphic_unit_id_requested INTEGER,
	-- The start and end time for the data to return
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	-- The number of hours in each reading requested
	reading_length_hours INTEGER
)
	RETURNS TABLE(reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	-- Holds the range of dates for returned data that fits the actual data.
	requested_range TSRANGE;
	--Holds the desired meter IDs in order to call meter_3d_readings_unit in the query below. 
	meter_ids INTEGER[];
	-- The number of hours in each reading determined
	reading_length_hours_use INTEGER;
	-- The number of hours in each reading determined as an interval
	reading_length_interval INTERVAL;
BEGIN
	--Get all the meter IDS that will be included in the group being requested.
	SELECT array_agg(DISTINCT gdm.meter_id) INTO meter_ids
	FROM groups_deep_meters_cache gdm
	WHERE group_id = group_id_requested;

	-- Find the correct number of hours per reading returned.
	SELECT * from reading_interval_3d(meter_ids, reading_length_hours) into reading_length_hours_use, reading_length_interval;
	-- Get the range of days requested by calling shrink_tsrange_to_group_readings_by_day.
	-- First make requested range only be full days by dropping any partial days at start/end.
	requested_range := shrink_tsrange_to_group_readings_by_day(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)), group_id_requested);

	IF (reading_length_hours_use <= 12) THEN
		-- Need to generate_series to group the desired hours together
		RETURN QUERY
			-- The readings are rates in the hourly table so want to average not sum so
			-- work for quantity, flow & raw.
			-- The time starts at the time of the generated sequence and ends at the length
			-- of each block later. This is the same as the start time of the next value
			-- in the sequence (except last one).
			SELECT
				AVG(ghr.reading_rate) as reading_rate,
				hours.hour AS start_timestamp,
				hours.hour + reading_length_interval  AS end_timestamp
				-- This is the series that starts at the beginning of the desired days,
				-- ends at the end of the desired days and steps by the desired interval.
				-- You need to subtract from the last interval for the end since generate_series
				-- is inclusive.
			FROM (
				SELECT hour
				FROM generate_series(
					lower(requested_range),
					upper(requested_range) - reading_length_interval,
					reading_length_interval
				) hours(hour)
			) hours(hour),
			-- Also need the values in the group hourly table.
			group_hourly_readings_unit_cagg ghr
			-- Only want the desired meter
			WHERE ghr.group_id = group_id_requested
			-- Only want the desired graphing unit
			AND ghr.graphic_unit_id = graphic_unit_id_requested
			-- Only want readings that lie within this slice of the desired data
			AND ghr.bucket >= hours.hour
			AND ghr.bucket <= hours.hour + reading_length_interval - INTERVAL '1 hour'
			-- Group by the start time of the generated series since all points in
			-- the desired slice have the same start time for the series.
			GROUP BY hours.hour
			-- Time sort by the start time for graphing.
			ORDER BY hours.hour
		;
	ELSE
		-- The reading rate is more than 12 so return a single row with dummy values that easy to detect.
		-- The end time differs from the start time by the meter reading frequency or min one for groups.
		-- This means the meter reading frequency is too long for a 3D graphic.
		RETURN QUERY
			SELECT -999::FLOAT, '1900-01-01 00:00:00'::TIMESTAMP, '1900-01-01 00:00:00'::TIMESTAMP + reading_length_interval
		;
	END IF;	
END;
$$ LANGUAGE 'plpgsql';
