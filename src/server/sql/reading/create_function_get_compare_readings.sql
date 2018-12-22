/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
This shouldn't ever be looking at more than a few weeks of data, so we don't need to deal with compression.
 */
CREATE OR REPLACE FUNCTION compare_readings (
	meter_ids INTEGER[],
	current_period_start TIMESTAMP,
	current_period_end TIMESTAMP,
	shift INTERVAL
)
	RETURNS TABLE(meter_id INTEGER, current_use REAL, prev_use REAL)
AS $$
DECLARE
	prev_period_start TIMESTAMP;
	prev_period_end TIMESTAMP;
BEGIN
	prev_period_start := current_period_start - shift;
	prev_period_end := current_period_end - shift;

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
		WHERE r.start_timestamp >= prev_period_start AND r.end_timestamp <= prev_period_end
		GROUP BY m.id
	)
	SELECT
		m.id AS meter_id,
		current_period.reading::REAL AS current_use,
		prev_period.reading::REAL AS prev_use
	FROM
		unnest(meter_ids) m(id)
		-- Left joins here so we get nulls instead of missing rows if readings don't exist for some time intervals
		LEFT JOIN prev_period ON m.id = prev_period.meter_id
		LEFT JOIN current_period ON m.id = current_period.meter_id;
END;
$$ LANGUAGE 'plpgsql';


CREATE OR REPLACE FUNCTION group_compare_readings (
	group_ids INTEGER[],
	current_period_start TIMESTAMP,
	current_period_end TIMESTAMP,
	shift INTERVAL
)
	RETURNS TABLE(group_id INTEGER, current_use REAL, prev_use REAL)
AS $$
DECLARE
	meter_ids INTEGER[];
BEGIN
	SELECT array_agg(DISTINCT meter_id) INTO meter_ids
	FROM unnest(group_ids) gids(id)
	INNER JOIN groups_deep_meters gdm ON gdm.group_id = gids.id;

	RETURN QUERY
	SELECT
		gids.id AS group_id,
		SUM(cr.current_use) AS current_use,
		SUM(cr.prev_use) AS prev_use
	FROM unnest(group_ids) gids(id)
	INNER JOIN groups_deep_meters gdm ON gdm.group_id = gids.id
	INNER JOIN compare_readings(meter_ids, current_period_start, current_period_end, shift) cr
			ON cr.meter_id = gdm.meter_id
	GROUP by gids.id;
END;
$$ LANGUAGE 'plpgsql'
