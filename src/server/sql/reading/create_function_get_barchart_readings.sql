/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
	This function sums the readings for an array of meters over a given duration that is repeated over a given time interval,
	and	returns a query
 */
CREATE OR REPLACE FUNCTION barchart_readings(
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
		WHERE (readings.start_timestamp, readings.end_timestamp) OVERLAPS (from_timestamp, to_timestamp);

		IF real_start_timestamp = '-infinity' OR real_end_timestamp = 'infinity' THEN
			-- If the time range was not shrunk then there were no readings and we should return no rows.
			RETURN; -- Return just returns an empty result set.
		END IF;

		-- If we didn't return then it's safe to subtract the timestamps
		real_duration := least(duration, real_end_timestamp - real_start_timestamp);

		RETURN QUERY
		SELECT
			r.meter_id,
			CAST(
					ROUND(SUM(
							 r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)))
							 * EXTRACT(epoch FROM (least(r.end_timestamp, (agg.start + real_duration)) - greatest(r.start_timestamp, agg.start)))
					)) AS INTEGER
			),
			agg.start,
			agg.start + real_duration
		FROM readings r
		INNER JOIN unnest(meter_ids) specific_meter(id) ON r.meter_id = specific_meter.id
			INNER JOIN generate_series(real_start_timestamp, real_end_timestamp, real_duration) agg(start)
				ON
					(r.start_timestamp, r.end_timestamp) OVERLAPS (agg.start, agg.start + real_duration)
					AND -- generate_series is an end-inclusive range, so we make it an open interval with the second OVERLAPS statement
					(agg.start, agg.start + duration) OVERLAPS (real_start_timestamp, real_end_timestamp)
		GROUP BY(r.meter_id, agg.start)
		ORDER BY r.meter_id, agg.start;
	END;
	$$ LANGUAGE plpgsql;
