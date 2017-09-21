/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
interval_precision must be both valid when casting
'1 <interval_precision>' as an interval and as an argument to
date_trunc().
 */
CREATE OR REPLACE FUNCTION reading_rates_compressed_to_interval(interval_precision TEXT)
	RETURNS TABLE(meter_id INT, reading_rate FLOAT, time_interval TSRANGE)
	AS $$
		DECLARE
			first_timestamp TIMESTAMP;
			last_timestamp TIMESTAMP;
			compression_interval INTERVAL;
		BEGIN
			compression_interval := ('1 ' || interval_precision)::INTERVAL;

			-- First calculate the range during readings take place
			SELECT date_trunc(interval_precision, MIN(r.start_timestamp)), MAX(r.end_timestamp)
			INTO first_timestamp, last_timestamp
			FROM readings r;

			RETURN QUERY
			WITH readings_by_compression_point AS (
					SELECT
						r.meter_id,
						/*
              This assumes that any readings are in kWh, and divides them by the number of hours in the interval to get
              readings in kW. It gets the number of hours by dividing the number of seconds by 3600.
            */
						r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600) AS reading_kw,
						compressed.start AS reading_start,
						extract(EPOCH FROM least(r.end_timestamp, compressed.start + compression_interval) - greatest(r.start_timestamp, compressed.start)) AS duration
					FROM readings r
						INNER JOIN generate_series(first_timestamp, last_timestamp - compression_interval, compression_interval) compressed(start) ON
							r.start_timestamp <= compressed.start + compression_interval AND r.end_timestamp >= compressed.start
			)
			SELECT
				r.meter_id,
				sum(r.reading_kw * r.duration) / sum(r.duration) AS reading_rate,
				tsrange(
					r.reading_start,
					r.reading_start + compression_interval,
					'()'
				)
			FROM readings_by_compression_point r
			GROUP BY r.meter_id, r.reading_start;
		END;
	$$ LANGUAGE plpgsql;


CREATE MATERIALIZED VIEW
hourly_readings
	AS SELECT * FROM reading_rates_compressed_to_interval('hour');

CREATE MATERIALIZED VIEW
daily_readings
	AS SELECT * FROM reading_rates_compressed_to_interval('day');

CREATE MATERIALIZED VIEW
monthly_readings
	AS SELECT * FROM reading_rates_compressed_to_interval('month');

CREATE MATERIALIZED VIEW
yearly_readings
	AS SELECT * FROM reading_rates_compressed_to_interval('year');

