/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create readings table
CREATE TABLE IF NOT EXISTS readings (
  meter_id INT NOT NULL REFERENCES meters(id),
  reading FLOAT NOT NULL,
  start_timestamp TIMESTAMP NOT NULL,
	end_timestamp TIMESTAMP NOT NULL,
	CHECK (start_timestamp < readings.end_timestamp),
  PRIMARY KEY (meter_id, start_timestamp)
);


CREATE MATERIALIZED VIEW IF NOT EXISTS
test_table
	AS SELECT
		-- This gives the weighted average of the reading rates, defined as
		-- sum(reading_rate * overlap_duration) / sum(overlap_duration)
		r.meter_id AS meter_id,
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
			(sum(
					(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / sum(
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			))
		WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(sum(
					(r.reading * 3600 / u.sec_in_rate) -- Reading rate in per hour
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / sum(
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			))
		END AS reading_rate, 
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    	(max((
					(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			)) )
			WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(max((
					(r.reading * 3600 / u.sec_in_rate)) -- Reading rate in kw
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			)) 
			END as max,
		CASE WHEN u.unit_represent = 'quantity'::unit_represent_type THEN
    	(min((
					(r.reading * 3600 / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))) -- Reading rate in kw
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			)) )
			WHEN (u.unit_represent = 'flow'::unit_represent_type OR u.unit_represent = 'raw'::unit_represent_type) THEN
			(min((
					(r.reading * 3600 / u.sec_in_rate)) -- Reading rate in kw
					*
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			) / (
					extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
									least(r.end_timestamp, gen.interval_start + '1 day'::INTERVAL)
									-
									greatest(r.start_timestamp, gen.interval_start)
					)
			)) 
			END as min,
		
		tsrange(gen.interval_start, gen.interval_start + '1 day'::INTERVAL, '()') AS time_interval
		FROM ((readings r
		-- This sequence of joins takes the meter id to its unit and in the final join
		-- it then uses the unit_index for this unit.
		INNER JOIN meters m ON r.meter_id = m.id)
		INNER JOIN units u ON m.unit_id = u.id)
			CROSS JOIN LATERAL generate_series(
					date_trunc('day', r.start_timestamp),
					-- Subtract 1 interval width because generate_series is end-inclusive
					date_trunc_up('day', r.end_timestamp) - '1 day'::INTERVAL,
					'1 day'::INTERVAL
			) gen(interval_start)
		GROUP BY r.meter_id, gen.interval_start, u.unit_represent
		-- The order by ensures that the materialized view will be clustered in this way.
		ORDER BY gen.interval_start, r.meter_id;