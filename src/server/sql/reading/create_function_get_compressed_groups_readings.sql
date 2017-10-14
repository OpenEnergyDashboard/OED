/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE OR REPLACE FUNCTION compressed_group_readings(
	group_ids INTEGER[],
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity',
	num_points INT = 500)
	RETURNS TABLE(group_ID INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		meter_ids INTEGER[];
	BEGIN
		SELECT array_agg(meter_id)
		INTO meter_ids
		FROM groups_deep_meters gdm
		INNER JOIN unnest(group_ids) gids(id) ON gids.id = gdm.group_id;

		RETURN QUERY
			SELECT
				gdm.group_id AS group_id,
				SUM(compressed.reading_rate) AS reading_rate,
				compressed.start_timestamp AS start_timestamp,
				compressed.end_timestamp AS end_timestamp
			FROM compressed_readings(meter_ids, from_timestamp, to_timestamp, num_points) compressed
			INNER JOIN groups_deep_meters gdm ON gdm.meter_id = compressed.meter_id
			GROUP by gdm.group_id, compressed.start_timestamp, compressed.end_timestamp
			ORDER BY gdm.group_id, compressed.start_timestamp;
	END;
$$ LANGUAGE plpgsql;

