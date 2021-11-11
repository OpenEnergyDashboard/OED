/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DROP VIEW IF EXISTS hourly_readings;

CREATE MATERIALIZED VIEW IF NOT EXISTS
hourly_readings
	AS SELECT
				r.meter_id AS meter_id,
				-- This gives the weighted average of the reading rates, defined as
				-- sum(reading_rate * overlap_duration) / sum(overlap_duration)
				(sum(
						 (r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) -- Reading rate in kw
						 *
						 extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
										 least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
										 -
										 greatest(r.start_timestamp, gen.interval_start)
						 )
				 ) / sum(
						 extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
										 least(r.end_timestamp, gen.interval_start + '1 hour'::INTERVAL)
										 -
										 greatest(r.start_timestamp, gen.interval_start)
						 )
				 )) AS reading_rate,
				tsrange(gen.interval_start, gen.interval_start + '1 hour'::INTERVAL, '()') AS time_interval
			FROM readings r
				CROSS JOIN LATERAL generate_series(
						date_trunc('hour', r.start_timestamp),
						-- Subtract 1 interval width because generate_series is end-inclusive
						date_trunc_up('hour', r.end_timestamp) - '1 hour'::INTERVAL,
						'1 hour'::INTERVAL
				) gen(interval_start)
			GROUP BY r.meter_id, gen.interval_start;
