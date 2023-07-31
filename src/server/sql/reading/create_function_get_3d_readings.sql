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
	SELECT tsrange(min(lower(time_interval)), max(upper(time_interval))) INTO readings_max_tsrange
	FROM daily_readings_unit
	where meter_id = meter_id_desired;
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';


-- Gets meters graphing data for 3D graphic by returning points that span the requested
-- length of time over the days requested. This function can be slower than lin readings
-- so is designed to be called for one year of less of data.
CREATE OR REPLACE FUNCTION meter_3d_readings_unit (
    -- The desired meter ids. It is normally a single value for a 3D graphic but groups
    -- may need multiple meters.
    meter_ids_requested INTEGER[],
    -- The desired graphic unit of the returned data
    graphic_unit_id INTEGER,
    -- The start/end time for the data to return
    start_stamp TIMESTAMP,
    end_stamp TIMESTAMP,
    -- The number of hours in each reading returned
    reading_length_hours INTEGER
)
    RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
    -- Holds the range of dates for returned data that fits the actual data.
    requested_range TSRANGE;
    -- The value associated with the graphing unit
    unit_column INTEGER;
    -- The slope of the conversion from meter to graphing units
    slope FLOAT;
   -- The intercept of the conversion from meter to graphing units
    intercept FLOAT;
    -- The length of each reading returned as an interval
    reading_length_interval INTERVAL;
	-- Which index of the meter_id array you are currently working on.
	current_meter_index INTEGER := 1;
	-- The id of the meter index working on
	current_meter_id INTEGER;
BEGIN
    -- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
    SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;
    --Requested hours per reading returned as an interval
    reading_length_interval := (reading_length_hours::TEXT || ' hour')::INTERVAL;

	-- Loop over all meters.
	WHILE current_meter_index <= cardinality(meter_ids_requested) LOOP
        -- ID of the current meter in loop
        current_meter_id := meter_ids_requested[current_meter_index];

        -- Get the conversion from the current meter's unit to the desired graphing unit.
        SELECT c.slope, c.intercept into slope, intercept
        FROM meters m
        INNER JOIN units u ON m.unit_id = u.id
        INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column
        WHERE m.id = current_meter_id
        ;

        -- Get the range of days requested by calling shrink_tsrange_to_meter_readings_by_day.
        -- First make requested range only be full days by dropping any partial days at start/end.
        requested_range := shrink_tsrange_to_meter_readings_by_day(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)), current_meter_id);

        -- This currently does a special case if you want every hour since there is no need to
        -- do the generate_series since that case aligns with the hourly table.
        -- The more general code is currently slower than desired so doing this.
        -- TODO Can we optimize the code so this is not needed or the slowdown is less?
        IF (reading_length_hours = 1) THEN
            -- If want every hour then can just return the items in the hourly table in the desired range of time.
            -- Note could do outside the meter loop as is done for line readings and use the DB to do all the
            -- meters but this makes both cases parallel and is still fast enough.
            RETURN QUERY
                SELECT
                    hr.meter_id as meter_id,
                    hr.reading_rate * slope + intercept as reading_rate,
                    lower(hr.time_interval) AS start_timestamp,
                    upper(hr.time_interval) AS end_timestamp
                FROM hourly_readings_unit hr
                -- Only want the desired meter and within the time requested
                WHERE hr.meter_id = current_meter_id and requested_range @> hr.time_interval
                 -- Time sort by which metrer and the start time for graphing.
                ORDER BY meter_id, start_timestamp
            ;      
        ELSE
            -- Need to generate_series to group the desired hours together
            RETURN QUERY
                -- The readings are rates in the hourly table so want to average not sum.
                -- The time starts at the time of the generated sequence and ends at the length
                -- of each block later. This is the same as the start time of the next value
                -- in the sequence (except last one).
                SELECT
                    hr.meter_id as meter_id,
                    AVG(hr.reading_rate) * slope + intercept as reading_rate,
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
                -- Also need the values in the hourly table.
                hourly_readings_unit hr
                -- Only want the desired meter
                WHERE hr.meter_id = current_meter_id
                -- Only want readings that lie within this slice of the desired data
                AND lower(hr.time_interval) >= hours.hour
                AND upper(hr.time_interval) <= hours.hour + reading_length_interval
                -- Group by the start time of the generated series since all points in
                -- the desired slice have the same start time for the series.
                -- Also group by the meter_id since Postgres wants and desired for graphing
                GROUP BY hours.hour, hr.meter_id
                -- Time sort by the meter and start time for graphing.
                ORDER BY hr.meter_id, hours.hour
            ;
        END IF;

        -- Go to the next meter
		current_meter_index := current_meter_index + 1;
	END LOOP;
END;
$$ LANGUAGE plpgsql;
