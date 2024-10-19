/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
This isn't technically needed as no function signature changed and a startup of OED should
replace the functions but do just to show/be safe.
 */

/*
This shouldn't ever be looking at more than a few weeks of data, so we don't need to deal with compression.
 */

/*
TODO This function can probably be improved for two reasons:
1) While it was noted that you don't look at too many days, it does limit its usage to modest time lengths.
There has been thought to allowing comparisons, for example, or a whole year. It also assumes that the
frequency of readings is not too high so the number of readings looked at could be large even over
modest time frames.
2) Readings are only included if they are within the current time period. This means that if you have
a reading that crosses the timeframe they are excluded. This can be viewed as either a good thing or
a bad thing. However, if the frequency of readings is high, then large segments of time can be excluded.
For example, monthly readings would not be includes in either day, week or four week comparisons that
OED currently does. Also note that the daily and hourly views do include readings that span a time frame
so including them would be consistent.

We need to think about how best to deal with this but one option is to use the daily and hourly tables
to get the reading values as in done with bar graphs. This needs to be a little different since partial
days can be involved. However, getting the full days from the daily table and then the hours from the
hourly table to be combined would solve this. (One could get the subhour from the raw readings but it is
unclear users would want that.) Another consider is that the current system, as is the case for bar graphs,
does not take into account missing times in readings which can lead to lower than expected values. The
daily and hourly readings would help fix this.
*/

/*
The following function returns data for plotting compare graphs. It works on meters.
It should not be used on raw readings.
This only works when the curr start/end times are on the hour as it uses the hourly reading view.
It will truncate to lose partial hours if they are given. The current client code will only
send full hours so this should be fine.
It is the new version of compare_readings that works with units. It takes these parameters:
meter_ids: A array of meter ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
curr_start: When the current/this time period begins for the compare.
curr_end: When the current/this time period ends for the compare.
shift: How far back in time to shift the curr_start and curr_end date/time to get the previous
	times to compare.
 */
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
	curr_tsrange TSRANGE;
	prev_tsrange TSRANGE;
BEGIN
	curr_tsrange := tsrange(curr_start, curr_end);
	prev_tsrange := tsrange(curr_start - shift, curr_end - shift);

	RETURN QUERY
	WITH
	curr_period AS (
		SELECT
			meters.id AS meter_id,
			-- Convert the reading based on the conversion found below.
			-- It is okay to sum the flow units because hourly readings has a rate of per hour so
			-- to convert to a quantity would multiply by 1 so it is the same formula.
			SUM(hourly.reading_rate) * c.slope + c.intercept AS reading
		FROM (((hourly_readings_unit hourly
		INNER JOIN unnest(meter_ids) meters(id) ON hourly.meter_id = meters.id)
		INNER JOIN meters m ON m.id = meters.id)
		-- This is getting the conversion for the meter and unit to graph.
		-- The slope and intercept are used above the transform the reading to the desired unit.
		INNER JOIN cik c on c.source_id = m.unit_id AND c.destination_id = graphic_unit_id)
		WHERE curr_tsrange @> hourly.time_interval
		GROUP BY meters.id, c.slope, c.intercept
	),
	prev_period AS (
		SELECT
			meters.id AS meter_id,
			-- Convert the reading based on the conversion found below.
			-- It is okay to sum the flow units because hourly readings has a rate of per hour so
			-- to convert to a quantity would multiply by 1 so it is the same formula.
			SUM(hourly.reading_rate) * c.slope + c.intercept AS reading
		FROM (((hourly_readings_unit hourly
		INNER JOIN unnest(meter_ids) meters(id) ON hourly.meter_id = meters.id)
		INNER JOIN meters m ON m.id = meters.id)
		-- This is getting the conversion for the meter and unit to graph.
		-- The slope and intercept are used above the transform the reading to the desired unit.
		INNER JOIN cik c on c.source_id = m.unit_id AND c.destination_id = graphic_unit_id)
		WHERE prev_tsrange @> hourly.time_interval
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
The following function returns data for plotting compare graphs. It works on groups.
It should not be used on raw readings.
See meter version for needing start/end on the hour.
It is the new version of group_compare_readings that works with units. It takes these parameters:
group_ids: A array of group ids to query.
graphic_unit_id: The unit id of the unit to use for the graph.
curr_start: When the current/this time period begins for the compare.
curr_end: When the current/this time period ends for the compare.
shift: How far back in time to shift the curr_start and curr_end date/time to get the previous
	times to compare.
 */
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
