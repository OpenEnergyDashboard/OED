/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
	This function sums the readings for an array of meters over a given duration that is repeated over a given time interval,
	and	returns a query
 */
CREATE OR REPLACE FUNCTION aggregate_readings(
	meter_ids INTEGER[],
	duration INTERVAL,
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity')
	RETURNS TABLE(meter_ID INTEGER, reading_sum INTEGER, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		real_start_timestamp TIMESTAMP;
		real_end_timestamp TIMESTAMP;
		real_duration INTERVAL;
	BEGIN
		SELECT
			greatest(MIN(readings.start_timestamp), from_timestamp), least(MAX(readings.end_timestamp), to_timestamp)
		INTO real_start_timestamp, real_end_timestamp
		FROM readings
		INNER JOIN unnest(meter_ids) specific_meter(id) ON readings.meter_id = specific_meter.id
		WHERE readings.end_timestamp >= from_timestamp AND readings.start_timestamp <= to_timestamp;

		real_duration := least(duration, real_end_timestamp - real_start_timestamp);

		RETURN QUERY
		SELECT
			r.meter_id,
			CAST(
					SUM(
							 r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))
							 * EXTRACT(epoch FROM (least(r.end_timestamp, (agg.start + real_duration)) - greatest(r.start_timestamp, agg.start)))
					) AS INTEGER
			),
			agg.start,
			agg.start + real_duration
		FROM readings r
		INNER JOIN unnest(meter_ids) specific_meter(id) ON r.meter_id = specific_meter.id
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp - real_duration, real_duration) agg(start)
			--ON r.start_timestamp <= agg.start + real_duration AND r.end_timestamp >= agg.start
			ON (r.start_timestamp, r.end_timestamp) OVERLAPS (agg.start, agg.start + real_duration)
		GROUP BY(r.meter_id, agg.start)
		ORDER BY r.meter_id, agg.start;
	END;
	$$ LANGUAGE plpgsql;
