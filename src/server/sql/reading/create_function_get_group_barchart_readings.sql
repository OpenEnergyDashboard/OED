/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

CREATE OR REPLACE FUNCTION barchart_group_readings(
	group_ids INTEGER[],
	duration INTERVAL,
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity')
	RETURNS TABLE(group_ID INTEGER, reading_sum INTEGER, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		meter_ids INTEGER[];
	BEGIN
		SELECT array_agg(meter_id)
		INTO meter_ids
		FROM groups_deep_meters gdm
			INNER JOIN unnest(group_ids) gids(id) ON gids.id = gdm.group_id;

		RETURN QUERY
		SELECT
			gdm.group_id AS group_ID,
			SUM(compressed.reading_sum)::INTEGER AS reading_sum,
			compressed.start_timestamp AS start_timestamp,
			compressed.end_timestamp AS end_timestamp
		FROM barchart_readings(meter_ids, duration, from_timestamp, to_timestamp) compressed
			INNER JOIN groups_deep_meters gdm ON gdm.meter_id = compressed.meter_id
			-- The previous line would include groups that are parents of the groups we want,
			-- so we remove those groups that are not requested here
			INNER JOIN unnest(group_ids) gids(group_id) ON gdm.group_id = gids.group_id
		GROUP by gdm.group_id, compressed.start_timestamp, compressed.end_timestamp;
	END;
$$ LANGUAGE plpgsql;
