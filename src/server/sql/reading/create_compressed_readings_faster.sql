
CREATE FUNCTION date_trunc_up(interval_precision TEXT, ts TIMESTAMP)
	RETURNS TIMESTAMP LANGUAGE SQL
	IMMUTABLE
	AS $$
		SELECT CASE
			WHEN ts = date_trunc(interval_precision, ts) THEN ts
			ELSE date_trunc(interval_precision, ts + ('1 ' || interval_precision)::INTERVAL)
			END
	$$;

CREATE FUNCTION compressed_readings_for_interval(interval_precision TEXT)
	RETURNS TABLE(meter_id INT, reading_rate FLOAT, time_interval TSRANGE)

	AS $$
	DECLARE
	interval_width INTERVAL;
	BEGIN
		interval_width := ('1' || interval_precision)::INTERVAL;

		RETURN QUERY
		SELECT
			meter_id,
			-- This gives the weighted average of the reading rates, defined as
			-- sum(reading_rate * overlap_duration) / sum(overlap_duration)
			(sum(
				(r.reading / (extract(EPOCH FROM (r.end_timestamp - r.start_timestamp)) / 3600)) -- Reading rate in kw
				*
				extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
								least(r.end_timestamp, gen.interval_start + interval_width)
								-
								greatest(r.start_timestamp, gen.interval_start)
				)
			) / sum(
						extract(EPOCH FROM -- The number of seconds that the reading shares with the interval
										least(r.end_timestamp, gen.interval_start + interval_width)
										-
										greatest(r.start_timestamp, gen.interval_start)
						)
					)) AS reading_rate,
			tsrange(gen.interval_start, gen.interval_start + interval_width, '()') AS time_interval
		FROM readings r
		CROSS JOIN LATERAL generate_series(
					date_trunc(interval_precision, r.start_timestamp),
					date_trunc_up(interval_precision, r.end_timestamp)
			) gen(interval_start)
		GROUP BY meter_id, gen.interval_start;
	END
	$$
