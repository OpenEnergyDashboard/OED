/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
The following function determines the correct duration view to query from, and returns compressed data from it.
 */
CREATE OR REPLACE FUNCTION compressed_readings_2(meter_ids INTEGER[], start_stamp TIMESTAMP, end_stamp TIMESTAMP, min_day_points INTEGER, min_hour_points INTEGER)
	RETURNS TABLE(meter_id INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP)
AS $$
DECLARE
	requested_interval INTERVAL;
	requested_range TSRANGE;

	/*
		The minimum day and hourly points are determined so that data is read from the daily view when the
		requested interval is at least two months, from the hourly view when between two months and at least two weeks,
		and directly from the raw readings table when under two weeks.

		+----------------------+--------------------
		| Space considerations |
		+----------------------+
		Each row returned by this function contains 1 INT (meter_id), 2 TIMESTAMPs (start/end stimestamp), and
		1 FLOAT (reading_rate). According to PostgreSQL documentation, the storage size of INT is 4 bytes,
		TIMESTAMP is 8 bytes, and FLOAT is 8 bytes, and so each row totals to 28 bytes of data.

		For example, if the requested range is one year, this algorithm will read from the materialized daily view
		and return 0.01 megabytes of data.
		
		From the hourly view, the number rows that can be read ranges from 360 (the minimum) to 60 * 24 = 1440
		points. Hence, the amount of data read from the hourly view ranges from 0.010 to 0.040 megabytes
		per meter. 
		
		From the readings table, the number of rows returned depends on the raw reading granularity.
		The most common reading granularity for electric meters is 15-minutes, which means the meter
		stores data for every 15-minute interval.

		The transition from hourly to raw readings occurs when the number of hourly points is 359 or less which is
		less than 15 days or roughly two weeks.

		If the granularity is 15-minutes, then the maximum amount of raw points is 359 * 4 = 1436, which translates
		to 0.040 megabytes per meter.
		If instead the raw readings granularity is 1-minute, then the maximum amount of raw points is 359 * 60 = 21540,
		which translates to 0.60 megabytes per meter. 
		

		+------+-------------------
		| Note |
		+------+
		- Note that the above documentation does not account for the increase in data when packaged in JSON format.
	*/
BEGIN

	requested_range := shrink_tsrange_to_real_readings(tsrange(start_stamp, end_stamp, '[]'));
	requested_interval := upper(requested_range) - lower(requested_range);

	IF extract(DAY FROM requested_interval) > min_day_points THEN
		RETURN QUERY
			SELECT
				daily.meter_id AS meter_id,
				daily.reading_rate,
				lower(daily.time_interval) AS start_timestamp,
				upper(daily.time_interval) AS end_timestamp
			FROM daily_readings daily
			INNER JOIN unnest(meter_ids) meters(id) ON daily.meter_id = meters.id
			WHERE requested_range @> time_interval;
	-- There's no quick way to get the number of hours in an interval. extract(HOURS FROM '1 day, 3 hours') gives 3.
	ELSIF extract(EPOCH FROM requested_interval)/3600 > min_hour_points THEN
		RETURN QUERY
			SELECT hourly.meter_id AS meter_id,
				hourly.reading_rate,
				lower(hourly.time_interval) AS start_timestamp,
				upper(hourly.time_interval) AS end_timestamp
			FROM hourly_readings hourly
			INNER JOIN unnest(meter_ids) meters(id) ON hourly.meter_id = meters.id
		WHERE requested_range @> time_interval;
	 ELSE
	-- Default to RAW data
 		RETURN QUERY
			SELECT r.meter_id as meter_id,
				(r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) as reading_rate, -- Reading rate in kw
 				r.start_timestamp,
 				r.end_timestamp
 			FROM readings r
 			INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id
 		WHERE lower(requested_range) <= r.start_timestamp AND r.end_timestamp <= upper(requested_range);
	 END IF;
END;
$$ LANGUAGE 'plpgsql';
