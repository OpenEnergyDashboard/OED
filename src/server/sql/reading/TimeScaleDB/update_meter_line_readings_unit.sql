/*
 * Function: meter_line_readings_unit
 *
 * Purpose:
 *
 *   Retrieve meter readings optimized for rendering line graphs. This function
 *   determines the most appropriate data resolution (raw, hourly, or daily)
 *   based on the requested time range, meter reading frequency, and configured
 *   point limits.
 *
 *   This function is the unit-aware replacement for compressed_readings_2.
 *   It supports graphic unit conversion and time-varying unit conversions.
 *
 *
 * Data sources:
 *
 *   Raw:
 *       Reads directly from the readings table and applies cik_vary conversion
 *       during query execution.
 *
 *   Hourly:
 *       Uses the TimescaleDB continuous aggregate:
 *
 *           meter_hourly_readings_unit_cagg
 *
 *       The continuous aggregate is built on top of:
 *
 *           hypertable_hourly_split
 *
 *       Hourly splitting and time-varying conversion metadata are applied
 *       before aggregation, avoiding runtime joins to cik_vary.
 *
 *   Daily:
 *       Uses the TimescaleDB continuous aggregate:
 *
 *           meter_daily_readings_unit_cagg
 *
 *       The daily continuous aggregate is built on top of:
 *
 *           meter_hourly_readings_unit_cagg
 *
 *       Daily aggregation reuses precomputed hourly aggregate values instead
 *       of recalculating from the hourly split hypertable.
 *
 *
 * Resolution selection:
 *
 *   When point_accuracy = 'auto', the function selects the highest resolution
 *   possible while staying within the requested point limits.
 *
 *   Selection order:
 *
 *       1. Raw readings
 *       2. Hourly continuous aggregate
 *       3. Daily continuous aggregate
 *
 *
 * Notes:
 *
 *   - Each meter is processed independently because meters may have different
 *     reading frequencies and available data ranges.
 *
 *   - The hourly data path previously queried the PostgreSQL materialized view:
 *
 *         meter_hourly_readings_unit
 *
 *     and now uses the TimescaleDB continuous aggregate:
 *
 *         meter_hourly_readings_unit_cagg
 *
 *   - The daily data path previously queried the PostgreSQL materialized view:
 *
 *         meter_daily_readings_unit
 *
 *     and now uses the TimescaleDB continuous aggregate:
 *
 *         meter_daily_readings_unit_cagg
 *
 *   - Design details:
 *
 *                           meter_line_readings_unit
 *                                     |
 *                    +----------------+----------------+
 *                    |                |                |
 *                    v                v                v
 *                readings     hourly continuous   daily continuous
 *                                 aggregate          aggregate
 *                                     |                |
 *                                     v                v
 *                      meter_hourly_readings_unit_cagg
 *                                                     |
 *                                                     v
 *                                      meter_daily_readings_unit_cagg
 */


/*
 * DAILY READINGS
 *
 * Uses TimescaleDB daily continuous aggregate.
 *
 * Data source:
 *
 *     meter_daily_readings_unit_cagg
 *
 * The daily continuous aggregate rolls up hourly aggregate values into
 * one-day intervals.
 *
 * The time interval is stored as a PostgreSQL tsrange:
 *
 *     ("2021-06-01 00:00:00","2021-06-02 00:00:00")
 *
 * The lower and upper bounds are converted back into timestamps so the
 * result matches the function return type.
 */


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
-- New version of meter_line_readings_unit that uses the new views.
CREATE OR REPLACE FUNCTION meter_line_readings_unit (
	meter_ids INTEGER[],
	-- This is the graphic unit id, changed from graphic_unit_id to avoid confusion with the graphic unit id in the view.
	passed_graphic_unit_id INTEGER,
	start_stamp TIMESTAMP,
	end_stamp TIMESTAMP,
	point_accuracy reading_line_accuracy,
	max_raw_points INTEGER,
	max_hour_points INTEGER
)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, min_rate FLOAT, max_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	requested_range TSRANGE;
	requested_interval INTERVAL;
	requested_interval_seconds INTEGER;
	frequency INTERVAL;
	frequency_seconds INTEGER;
	-- Which index of the meter_id array you are currently working on.
	current_meter_index INTEGER := 1;
	-- The id of the meter index working on
	current_meter_id INTEGER;
	-- Holds accuracy for current meter.
	current_point_accuracy reading_line_accuracy;
	BEGIN
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
		IF (current_point_accuracy = 'auto'::reading_line_accuracy) THEN
			-- The request wants automatic calculation of the points returned.

			-- The request_range will still be infinity if there is no meter data. This causes the
			-- auto calculation to fail because you cannot subtract them.
			-- Just check the upper range since simpler.
			IF (upper(requested_range) = 'infinity') THEN
				-- We know there is no data but easier to just let a query happen since fast.
				-- Do daily since that should be the fastest due to the least data in most cases.
				current_point_accuracy := 'daily'::reading_line_accuracy;
			ELSE
				-- The interval of time for the requested_range.
				requested_interval := upper(requested_range) - lower(requested_range);
				-- Get the seconds in the interval.
				-- Wanted to use the INTO syntax used above but could not get it to work so using the set syntax.
				requested_interval_seconds := (SELECT * FROM EXTRACT(EPOCH FROM requested_interval));
				-- Get the frequency that this meter reads at.
				SELECT reading_frequency INTO frequency FROM meters WHERE id = current_meter_id;
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
		END IF;
		-- At this point current_point_accuracy should never be 'auto'.

		IF (current_point_accuracy = 'raw'::reading_line_accuracy) THEN
			-- Gets raw meter data to graph.
			-- Modified to allow for raw time varying conversions.
			RETURN QUERY
				SELECT r.meter_id as meter_id,
				CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
					-- If it is quantity readings then need to convert to rate per hour by dividing by the time length where
					-- the 3600 is needed since EPOCH is in seconds.
					-- Normalize to rate over reading interval
					SUM(
						--Wrapped in SUM to handle multiple matching cik_vary conversions
						-- Weight by conversion duration(intersection of reading and conversion time ranges is necessary because the conversion may overlap the reading time range)
						 (EXTRACT(EPOCH FROM (
							upper(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
							-
							lower(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
		  					)) / 3600)
						* (c.slope * (r.reading / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) + c.intercept)
	  				) / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)
				WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
					-- If it is flow or raw readings then it is already a rate so just convert it but also need to normalize
					-- to per hour.
					SUM(
						--Wrapped in SUM to handle multiple matching cik_vary conversions
						-- Weight by conversion duration (intersection of reading and conversion time ranges is necessary because the conversion may overlap the reading time range)
						 (EXTRACT(EPOCH FROM (
							upper(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
							-
							lower(tsrange(c.start_time, c.end_time, '()') * tsrange(r.start_timestamp, r.end_timestamp, '[]'))
		  					)) / 3600)
						* (c.slope * (r.reading * 3600 / u.sec_in_rate) + c.intercept)
	  				) / (EXTRACT(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)
				END AS reading_rate,
				-- There is no range of values on raw/meter data so return NaN to indicate that.
				-- The route will return this as null when it shows up in Redux state.
				cast('NaN' AS DOUBLE PRECISION) AS min_rate,
				cast('NaN' AS DOUBLE PRECISION) as max_rate,
				r.start_timestamp,
				r.end_timestamp

				FROM (((readings r
				INNER JOIN meters m ON m.id = current_meter_id)
				INNER JOIN units u ON m.unit_id = u.id)
				INNER JOIN cik_vary c on c.source_id = m.unit_id
					AND c.destination_id = passed_graphic_unit_id
					--The condition below was added for time varying conversions (allows for multiple cik_vary rows to be applied to a single reading)
					--The cik_vary exclusive bounds '()' ensures no two conversions overlap.
					AND tsrange(c.start_time, c.end_time, '()') && tsrange(r.start_timestamp, r.end_timestamp, '[]'))
				WHERE lower(requested_range) <= r.start_timestamp AND r.end_timestamp <= upper(requested_range) AND r.meter_id = current_meter_id
				-- Added GROUP BY to allow SUM to aggregate correctly across multiple rows.
				-- TODO : postgreSQL doesn't understand unit_represent cannot change for a given meter, so it has to be in group by. Might be worth finding fix.
				GROUP BY r.meter_id, r.start_timestamp, r.end_timestamp, u.unit_represent
				-- This ensures the data is sorted
				ORDER BY r.start_timestamp ASC;
		-- The first part is making sure that the number of hour points is 1440 or less.
		-- Thus, check if no more than 1440 hours * 60 minutes/hour * 60 seconds/hour = 5184000 seconds.
		-- The second part is making sure that the frequency of reading is an hour or less (3600 seconds)
		-- so you don't interpolate points by using the hourly data.
		/*
         * HOURLY READINGS
         *
         * Uses TimescaleDB continuous aggregate.
         */
		ELSIF (current_point_accuracy = 'hourly'::reading_line_accuracy) THEN
			-- Get hourly points to graph. See daily for more comments.
			-- Now uses materialized view for hourly meter readings.
			RETURN QUERY
				-- Modified to Retrieve converted hourly readings from the materialized view.
				SELECT
					hourly.meter_id AS meter_id,
					hourly.reading_rate AS reading_rate,
					hourly.min_rate AS min_rate,
					hourly.max_rate AS max_rate,
					hourly.bucket AS start_timestamp,
					hourly.bucket + INTERVAL '1 hour' AS end_timestamp
				FROM
					meter_hourly_readings_unit_cagg AS hourly
				WHERE
					requested_range @> tsrange(hourly.bucket, hourly.bucket + INTERVAL '1 hour', '()')
					AND hourly.meter_id = current_meter_id
					AND hourly.graphic_unit_id = passed_graphic_unit_id
				ORDER BY
					start_timestamp ASC;
		/*
         * DAILY READINGS
		 *
         * Uses TimescaleDB continuous aggregate.
         */
		ELSE
			RETURN QUERY
				-- Modified to retrieve converted daily readings from the materialized view.
				SELECT
					daily.meter_id AS meter_id,
					daily.reading_rate AS reading_rate,
					daily.min_rate AS min_rate,
					daily.max_rate AS max_rate,
					daily.bucket AS start_timestamp,
					daily.bucket + INTERVAL '1 day' AS end_timestamp
				FROM
					meter_daily_readings_unit_cagg AS daily
				WHERE
					requested_range @> tsrange(daily.bucket, daily.bucket + INTERVAL '1 day', '()')
					AND daily.meter_id = current_meter_id
					AND daily.graphic_unit_id = passed_graphic_unit_id
				ORDER BY
					start_timestamp ASC;
		END IF;
		current_meter_index := current_meter_index + 1;
	END LOOP;
END;
$$ LANGUAGE 'plpgsql';
