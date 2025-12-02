/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
-- New version of the meter_compare_readings function that uses the meter_hourly_readings_unit view.
CREATE OR REPLACE FUNCTION meter_compare_readings_unit (
	meter_ids INTEGER[],
	-- This is the graphic unit id, changed from graphic_unit_id to avoid confusion with the graphic unit id in the view.
	passed_graphic_unit_id INTEGER,
	curr_start TIMESTAMP,
	curr_end TIMESTAMP,
	shift INTERVAL
)
	RETURNS TABLE(meter_id INTEGER, curr_use FLOAT, prev_use FLOAT)
AS $$
DECLARE
	curr_tsrange TSRANGE;
	prev_tsrange TSRANGE;
BEGIN
	curr_tsrange := tsrange(curr_start, curr_end);
	prev_tsrange := tsrange(curr_start - shift, curr_end - shift);
	-- Modified to retrieve converted hourly readings from the materialized view.
	RETURN QUERY
	WITH
	curr_period AS (
		SELECT
			hourly.meter_id AS meter_id,
			SUM(hourly.reading_rate) AS reading
		FROM meter_hourly_readings_unit hourly
		WHERE
			-- The range requested must be completely within the hour so partial hours are not included.
			curr_tsrange @> hourly.time_interval AND
			hourly.graphic_unit_id = passed_graphic_unit_id AND
			hourly.meter_id = ANY(meter_ids)
		GROUP BY hourly.meter_id
	),
	prev_period AS (
		SELECT
			hourly.meter_id AS meter_id,
			SUM(hourly.reading_rate) AS reading
		FROM meter_hourly_readings_unit hourly
		WHERE
			-- The range requested must be completely within the hour so partial hours are not included.
			prev_tsrange @> hourly.time_interval AND
			hourly.graphic_unit_id = passed_graphic_unit_id AND
			hourly.meter_id = ANY(meter_ids)
		GROUP BY hourly.meter_id
	)
	SELECT
		meters.id AS meter_id,
		curr_period.reading::FLOAT AS curr_use,
		prev_period.reading::FLOAT AS prev_use
	FROM
		unnest(meter_ids) meters(id)
		-- Left joins here so we get nulls instead of missing rows if readings don't exist for some time intervals
		LEFT JOIN prev_period ON meters.id = prev_period.meter_id
		LEFT JOIN curr_period ON meters.id = curr_period.meter_id;
END;
$$ LANGUAGE 'plpgsql';