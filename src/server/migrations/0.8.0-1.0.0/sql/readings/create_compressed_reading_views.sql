/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
The following function determines the correct duration view to query from, and returns compressed data from it.
It is designed to return data for plotting line graphs with quantity data. It works on meters.
It is the new version of compressed_readings_2 that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
min_data_points: The minimum number of data points to return if using the day view.
min_hour_points: The minimum number of data points to return if using the hour view.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
CREATE OR REPLACE FUNCTION line_meters_quantity_readings(meter_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
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
				daily.reading_rate * c.slope + c.intercept as reading_rate,
				lower(daily.time_interval) AS start_timestamp,
				upper(daily.time_interval) AS end_timestamp
			FROM ((((daily_readings daily
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
				hourly.reading_rate * c.slope + c.intercept as reading_rate,
				lower(hourly.time_interval) AS start_timestamp,
				upper(hourly.time_interval) AS end_timestamp
			FROM ((((hourly_readings hourly
			INNER JOIN unnest(meter_ids) meters(id) ON hourly.meter_id = meters.id)
			INNER JOIN meters m ON m.id = meters.id)
			INNER JOIN units u ON m.unit_id = u.id)
			INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		WHERE requested_range @> time_interval;
	 ELSE
		-- Default to raw/meter data to graph. See daily for more comments.
 		RETURN QUERY
			SELECT r.meter_id as meter_id,
				-- Reading rate in kw
				((r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) * c.slope + c.intercept) as reading_rate,
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
The following function determines the correct duration view to query from, and returns compressed data from it.
It is designed to return data for plotting line graphs with quantity data. It works on groups.
It is the new version of compressed_group_readings_2 that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
start_timestamp: The start timestamp of the data to return.
end_timestamp: The end timestamp of the data to return.
min_data_points: The minimum number of data points to return if using the day view.
min_hour_points: The minimum number of data points to return if using the hour view.
Details on how this function works can be found in the devDocs in the resource generalization document.
 */
CREATE OR REPLACE FUNCTION line_groups_quantity_readings(group_ids INTEGER[], graphic_unit_id INTEGER, start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
	RETURNS TABLE(group_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
	DECLARE
		meter_ids INTEGER[];
	BEGIN
		-- First get all the meter ids that will be included in one or more groups being queried
		SELECT array_agg(gdm.meter_id) INTO meter_ids
		FROM groups_deep_meters gdm
		INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

		RETURN QUERY
			SELECT
				gdm.group_id AS group_id,
				SUM(compressed.reading_rate) AS reading_rate,
				compressed.start_timestamp,
				compressed.end_timestamp
			FROM line_meters_quantity_readings(meter_ids, graphic_unit_id, start_stamp, end_stamp, min_day_points, min_hour_points) compressed
			INNER JOIN groups_deep_meters gdm ON compressed.meter_id = gdm.meter_id
			INNER JOIN unnest(group_ids) gids(id) on gdm.group_id = gids.id
			GROUP BY gdm.group_id, compressed.start_timestamp, compressed.end_timestamp;
	END;
$$ LANGUAGE 'plpgsql';
