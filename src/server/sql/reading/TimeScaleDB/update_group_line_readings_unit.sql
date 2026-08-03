/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
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
	requested_graphic_unit_id INTEGER,
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
	FROM groups_deep_meters_cache gdm
	INNER JOIN unnest(group_ids) gids(id) ON gdm.group_id = gids.id;

	-- Calculate point accuracy if request (auto) or if raw since that is not allowed for groups.
	IF (point_accuracy = 'auto'::reading_line_accuracy OR point_accuracy = 'raw'::reading_line_accuracy) THEN
		-- The request needs automatic calculation of the points returned.

		-- Make sure the time range is within the reading values for meters in this group.
		requested_range := shrink_tsrange_to_real_readings(tsrange(start_stamp, end_stamp, '[]'), meter_ids);
		-- The request_range will still be infinity if there is no meter data. This causes the
		-- auto calculation to fail because you cannot subtract them.
		-- Just check the upper range since simpler.
		IF (upper(requested_range) = 'infinity') THEN
			-- We know there is no data but easier to just let a query happen since fast.
			-- Do daily since that should be the fastest due to the least data in most cases.
			point_accuracy := 'daily'::reading_line_accuracy;
		ELSE
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
	END IF;
	-- point_accuracy should either be daily or hourly at this point.

	IF (point_accuracy = 'daily'::reading_line_accuracy) THEN
	RETURN QUERY
		SELECT
			readings.group_id,
			readings.reading_rate,
			readings.bucket AS start_timestamp,
			readings.bucket + INTERVAL '1 day' AS end_timestamp
		FROM group_daily_readings_unit_cagg readings
		INNER JOIN unnest(group_ids) gids(id) ON readings.group_id = gids.id
		WHERE readings.graphic_unit_id = requested_graphic_unit_id
		-- Undefined API bounds arrive as NULL. Convert them to PostgreSQL
		-- infinities while keeping bucket directly usable by its B-tree index.
		AND readings.bucket >= COALESCE(start_stamp, '-infinity'::TIMESTAMP)
		AND readings.bucket <= COALESCE(end_stamp, 'infinity'::TIMESTAMP) - INTERVAL '1 day'
		ORDER BY readings.bucket ASC;

    ELSIF (point_accuracy = 'hourly'::reading_line_accuracy) THEN
        RETURN QUERY
            SELECT
                readings.group_id AS group_id,
                readings.reading_rate AS reading_rate,
                readings.bucket AS start_timestamp,
                readings.bucket + INTERVAL '1 hour' AS end_timestamp
            FROM group_hourly_readings_unit_cagg readings
            INNER JOIN unnest(group_ids) gids(id) ON readings.group_id = gids.id
            WHERE readings.graphic_unit_id = requested_graphic_unit_id
            -- Undefined API bounds arrive as NULL. Convert them to PostgreSQL
            -- infinities while keeping bucket directly usable by its B-tree index.
            AND readings.bucket >= COALESCE(start_stamp, '-infinity'::TIMESTAMP)
            AND readings.bucket <= COALESCE(end_stamp, 'infinity'::TIMESTAMP) - INTERVAL '1 hour'
            ORDER BY readings.bucket ASC;
    END IF;
END;
$$ LANGUAGE 'plpgsql';
