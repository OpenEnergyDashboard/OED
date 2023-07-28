/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

-- TODO need to update description
/*
    The meter_3d_readings_unit function works similarly to the meter_line_readings_unit but it returns
    a table of hourly readings. The parameters are meter_id (ID of meter requested),
    graphic_unit_id (ID of the unit being requested), start_stamp, end_stamp (date ranges requested e.g. 2023-01-09)
*/
CREATE OR REPLACE FUNCTION meter_3d_readings_unit (
    meter_id_requested INTEGER,
    graphic_unit_id INTEGER,
    start_stamp TIMESTAMP,
    end_stamp TIMESTAMP,
    reading_length_hours INTEGER
)
RETURNS TABLE(reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
    -- TODO comments
    requested_range TSRANGE;
    unit_column INTEGER;
    reading_length_interval INTERVAL;
BEGIN

    -- unit_column holds the column index into the cik table. This is the unit that was requested for graphing.
    SELECT unit_index INTO unit_column FROM units WHERE id = graphic_unit_id;

    -- Get the range of days requested by calling shrink_tsrange_to_real_readings_by_day.
    -- First make requested range only be full days by dropping any partial days at start/end.
    requested_range := shrink_tsrange_to_real_readings_by_day(tsrange(date_trunc_up('day', start_stamp), date_trunc('day', end_stamp)));

    --Requested hours per reading returned as an interval
    reading_length_interval := (reading_length_hours::TEXT || ' hour')::INTERVAL;

    -- TODO add back in comments as in meter_line, hourly_readings
    RETURN QUERY
		SELECT
            AVG(hourly_readings.reading_rate) AS reading_rate,
			gen.interval_start AS start_timestamp,
			gen.interval_start + reading_length_interval AS end_timestamp
            -- Was in view
            	-- tsrange(gen.interval_start, gen.interval_start + '1 hour'::INTERVAL, '()') AS time_interval
		FROM (SELECT
                --  TODO better if did conversion after average
			    hourly.reading_rate * c.slope + c.intercept AS reading_rate,
                lower(hourly.time_interval) AS start_timestamp,
			    upper(hourly.time_interval) AS end_timestamp
		        FROM (((hourly_readings_unit hourly
			    INNER JOIN meters m ON m.id = meter_id_requested)
			    INNER JOIN units u ON m.unit_id = u.id)
			    INNER JOIN cik c on c.row_index = u.unit_index AND c.column_index = unit_column)
			    WHERE requested_range @> time_interval AND hourly.meter_id = meter_id_requested
			    -- This ensures the data is sorted
			    ORDER BY start_timestamp ASC
            ) AS hourly_readings
            CROSS JOIN LATERAL generate_series(
                -- May not need trunc if whole day/hour
			        date_trunc('hour', start_stamp),
			        date_trunc_up('hour', end_stamp) - reading_length_interval,
			        reading_length_interval
		    ) gen(interval_start)
            -- new
            WHERE hourly_readings.start_timestamp BETWEEN gen.interval_start AND gen.interval_start + reading_length_interval AND hourly_readings.end_timestamp BETWEEN gen.interval_start AND gen.interval_start + reading_length_interval
            GROUP BY gen.interval_start 
            ORDER BY start_timestamp ASC;
            
END;
$$ LANGUAGE plpgsql;
