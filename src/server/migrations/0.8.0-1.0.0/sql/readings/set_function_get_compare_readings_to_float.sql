/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
The following function returns data for plotting bacompare graphs. It works on meters.
It should not be used on raw readings.
It is the new version of compare_readings that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
curr_start: When the current/this time period begins for the compare.
curr_end: When the current/this time period ends for the compare.
shift: How far back in time to shift the curr_start and curr_end date/time to get the previous
	times to compare.
 */

-- This changes the signature of the function. It did not exist before version 1.0 but if
-- someone has it then you have to drop before replace so doing to be safe.
DROP FUNCTION IF EXISTS meter_compare_readings_unit;
 
CREATE OR REPLACE FUNCTION meter_compare_readings_unit (
	meter_ids INTEGER[],
	graphic_unit_id INTEGER,
	curr_start TIMESTAMP,
	curr_end TIMESTAMP,
	shift INTERVAL
)
	RETURNS TABLE(meter_id INTEGER, curr_use FLOAT, prev_use FLOAT)
AS $$
DECLARE
	prev_start TIMESTAMP;
	prev_end TIMESTAMP;
	unit_column INTEGER;
BEGIN
	prev_start := curr_start - shift;
	prev_end := curr_end - shift;
	-- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
	SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;

	RETURN QUERY
	WITH
	curr_period AS (
		SELECT
			meters.id AS meter_id,
			-- Convert the reading based on the conversion found below.
			SUM(r.reading) * c.slope + c.intercept AS reading
		FROM ((((readings r
		INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id)
		-- This sequence of joins takes the meter id to its unit and in the final join
		-- it then uses the unit_index for this unit.
		INNER JOIN meters m ON m.id = meters.id)
		INNER JOIN units u ON m.unit_id = u.id)
		-- This is getting the conversion for the meter (row_index) and unit to graph (column_index).
		-- The slope and intercept are used above the transform the reading to the desired unit.
		INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		WHERE r.start_timestamp >= curr_start AND r.end_timestamp <= curr_end
		GROUP BY meters.id, c.slope, c.intercept
	),
	prev_period AS (
		SELECT
			meters.id AS meter_id,
			-- Convert the reading based on the conversion found below.
			SUM(r.reading) * c.slope + c.intercept AS reading
		FROM ((((readings r
			INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id)
		-- This sequence of joins takes the meter id to its unit and in the final join
		-- it then uses the unit_index for this unit.
		INNER JOIN meters m ON m.id = meters.id)
		INNER JOIN units u ON m.unit_id = u.id)
		-- This is getting the conversion for the meter (row_index) and unit to graph (column_index).
		-- The slope and intercept are used above the transform the reading to the desired unit.
		INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
		WHERE r.start_timestamp >= prev_start AND r.end_timestamp <= prev_end
		GROUP BY meters.id, c.slope, c.intercept
	)
	SELECT
		meters.id AS meter_id,
		curr_period.reading::FLOAT AS curr_use,
		prev_period.reading::FLOAT AS prev_use
	FROM
		unnest(meter_ids) meters(id)
		-- Left joins here so we get nulls instead of missing rows if readings don't exist for some time intervals
		LEFT JOIN prev_period ON meters.id = prev_period.meter_id
		LEFT JOIN curr_period ON meters.id = curr_period.meter_id;
END;
$$ LANGUAGE 'plpgsql';


/*
The following function returns data for plotting bacompare graphs. It works on groups.
It should not be used on raw readings.
It is the new version of group_compare_readings that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
curr_start: When the current/this time period begins for the compare.
curr_end: When the current/this time period ends for the compare.
shift: How far back in time to shift the curr_start and curr_end date/time to get the previous
	times to compare.
 */

-- This changes the signature of the function. It did not exist before version 1.0 but if
-- someone has it then you have to drop before replace so doing to be safe.
DROP FUNCTION IF EXISTS group_compare_readings_unit;

CREATE OR REPLACE FUNCTION group_compare_readings_unit (
	group_ids INTEGER[],
	graphic_unit_id INTEGER,
	curr_start TIMESTAMP,
	curr_end TIMESTAMP,
	shift INTERVAL
)
	RETURNS TABLE(group_id INTEGER, curr_use FLOAT, prev_use FLOAT)
AS $$
DECLARE
	meter_ids INTEGER[];
BEGIN
	SELECT array_agg(DISTINCT meter_id) INTO meter_ids
	FROM unnest(group_ids) gids(id)
	INNER JOIN groups_deep_meters gdm ON gdm.group_id = gids.id;

	RETURN QUERY
	SELECT
		gids.id AS group_id,
		SUM(cr.curr_use) AS curr_use,
		SUM(cr.prev_use) AS prev_use
	FROM unnest(group_ids) gids(id)
	INNER JOIN groups_deep_meters gdm ON gdm.group_id = gids.id
	INNER JOIN meter_compare_readings_unit(meter_ids, graphic_unit_id, curr_start, curr_end, shift) cr
			ON cr.meter_id = gdm.meter_id
	GROUP by gids.id;
END;
$$ LANGUAGE 'plpgsql';
