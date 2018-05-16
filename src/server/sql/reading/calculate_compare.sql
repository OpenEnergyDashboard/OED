/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*

	The compare chart needs three pieces of raw information for each meter:

	1. How much was used during this time period?
	2. How much was used during the previous time period?
	3. How much was used up to this point in the previous time period
 */

/*
This shouldn't ever be looking at more than a few weeks of data, so we don't need to deal with compression.
 */
CREATE FUNCTION compare_readings(
	meter_ids INTEGER[],
	current_period_start TIMESTAMP,
	current_period_end TIMESTAMP,
	period_duration INTERVAL
)
	RETURNS TABLE(meter_id INTEGER, current_use REAL, prev_use_total REAL, prev_use_for_current REAL)
AS $$
DECLARE
	prev_period_start TIMESTAMP;
	curr_period_duration INTERVAL; -- How far into the current period we are
	prev_period_partial_end TIMESTAMP;
BEGIN
	curr_period_duration := current_period_end - current_period_start;
	ASSERT curr_period_duration <= period_duration, 'Current period is too long';
	prev_period_start := current_period_start - period_duration;
	prev_period_partial_end := prev_period_start + curr_period_duration;

	RETURN QUERY
	WITH
	current_period AS (
		SELECT
			m.id AS meter_id,
			SUM(r.reading) AS reading
		FROM readings r
		INNER JOIN unnest(meter_ids) m(id) ON r.meter_id = m.id
		WHERE r.start_timestamp >= current_period_start AND r.end_timestamp <= current_period_end
		GROUP BY m.id
	),
	prev_period AS (
		SELECT
			m.id AS meter_id,
			SUM(r.reading) AS reading
		FROM readings r
			INNER JOIN unnest(meter_ids) m(id) ON r.meter_id = m.id
		WHERE r.start_timestamp >= prev_period_start AND r.end_timestamp <= current_period_start -- prev_end == curr_start
		GROUP BY m.id
	),
	prev_period_partial AS (
		SELECT
			m.id AS meter_id,
			SUM(r.reading) AS reading
		FROM readings r
			INNER JOIN unnest(meter_ids) m(id) ON r.meter_id = m.id
		WHERE r.start_timestamp >= prev_period_start AND r.end_timestamp <= prev_period_partial_end
		GROUP BY m.id
	)
	SELECT
		m.id AS meter_id,
		current_period.reading::REAL AS current_use,
		prev_period.reading::REAL AS prev_use_total,
		prev_period_partial.reading::REAL AS prev_use_for_current
	FROM
		unnest(meter_ids) m(id)
		-- Left joins here so we get nulls instead of missing rows if readings don't exist for some time intervals
		LEFT JOIN prev_period ON m.id = prev_period.meter_id
		LEFT JOIN prev_period_partial ON m.id = prev_period_partial.meter_id
		LEFT JOIN current_period ON m.id = current_period.meter_id;
END;
$$ LANGUAGE 'plpgsql';
