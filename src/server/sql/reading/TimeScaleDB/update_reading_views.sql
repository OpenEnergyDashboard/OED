/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
/*
Rounds a timestamp up to the next interval.
 */
CREATE OR REPLACE FUNCTION date_trunc_up(interval_precision TEXT, ts TIMESTAMP)
	RETURNS TIMESTAMP LANGUAGE SQL
IMMUTABLE
AS $$
SELECT CASE
	 WHEN ts = date_trunc(interval_precision, ts) THEN ts
	 ELSE date_trunc(interval_precision, ts + ('1 ' || interval_precision)::INTERVAL)
	 END
$$;

/*
Restricts a requested range to the available raw readings for the supplied
meters.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_real_readings(tsrange_to_shrink TSRANGE, meter_ids INTEGER[])
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(start_timestamp), max(end_timestamp)) INTO readings_max_tsrange
	FROM readings r
	INNER JOIN unnest(meter_ids) meters(id) ON r.meter_id = meters.id;
	RETURN tsrange_to_shrink * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';

-- TODO: Remove this retained legacy function once the hypertable
-- implementation is finalized. group_graphic_units_cache replaces it.
-- CREATE OR REPLACE FUNCTION get_graphic_unit(requested_group_id INTEGER)
-- RETURNS INTEGER[] AS $$
-- DECLARE
-- 	src_ids INTEGER[];
-- 	dest_ids INTEGER[];
-- 	child_meters_unit_ids INTEGER[];
-- 	unit_ids_compatible INTEGER[] := '{}';
-- 	unit_id INTEGER;
-- BEGIN
-- 	SELECT array_agg(DISTINCT m.unit_id) INTO child_meters_unit_ids
-- 	FROM groups_deep_meters_cache gdm
-- 	JOIN meters m ON m.id = gdm.meter_id
-- 	WHERE gdm.group_id = requested_group_id;
--
-- 	SELECT array_agg(u.id) INTO dest_ids
-- 	FROM units u
-- 	JOIN cik c ON u.id = c.destination_id;
--
-- 	FOREACH unit_id IN ARRAY dest_ids
-- 	LOOP
-- 		SELECT array_agg(source_id) INTO src_ids
-- 		FROM cik
-- 		WHERE destination_id = unit_id;
--
-- 		IF src_ids @> child_meters_unit_ids
-- 			AND NOT (unit_id = ANY (unit_ids_compatible))
-- 		THEN
-- 			unit_ids_compatible := array_append(unit_ids_compatible, unit_id);
-- 		END IF;
-- 	END LOOP;
--
-- 	RETURN unit_ids_compatible;
-- END;
-- $$ LANGUAGE 'plpgsql';

/*
This takes tsrange_to_shrink which is the requested time range to plot and makes sure it does
not exceed the start/end times for all the readings. This can be an issue, in particular,
because infinity is used to indicate to graph all readings. This version does it to the nearest
day by using the day reading view since bars use to the nearest day and this should be faster.
This should be fine since bar uses the same view to get data.
 */
CREATE OR REPLACE FUNCTION shrink_tsrange_to_meters_by_day(tsrange_to_shrink TSRANGE, meter_ids INTEGER[])
	RETURNS TSRANGE
AS $$
DECLARE
	readings_max_tsrange TSRANGE;
BEGIN
	SELECT tsrange(min(bucket), max(bucket + INTERVAL '1 day')) INTO readings_max_tsrange
	FROM meter_daily_readings_unit_cagg dr
	-- Get all the meter_ids in the passed array of meters.
	INNER JOIN unnest(meter_ids) meters(id) ON dr.meter_id = meters.id;
	-- Make the original range be to the day by dropping parts of days at start/end.
	RETURN tsrange(date_trunc_up('day', lower(tsrange_to_shrink)), date_trunc('day', upper(tsrange_to_shrink))) * readings_max_tsrange;
END;
$$ LANGUAGE 'plpgsql';
