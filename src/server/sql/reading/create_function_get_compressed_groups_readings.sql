/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
	This function gets compressed meter readings over a short duration.
*/
CREATE OR REPLACE FUNCTION compressed_group_readings(
	group_ids INTEGER[],
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity',
	num_points INT = 500)

	-- Return a table containing the id, reading rate, and intervals as columns.
	RETURNS TABLE(group_ID INTEGER, reading_rate FLOAT, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$

	-- Creates an array of meter ids.
	DECLARE
		meter_ids INTEGER[];

	BEGIN
		-- Find a temporary variable "array_agg" that has an attribute of meter_id from the groups_deep_meters table,
		-- then put array_agg into the array meter_ids.
		SELECT array_agg(meter_id)
		INTO meter_ids
		FROM groups_deep_meters gdm
		-- Create a temporary variable "gids" that has an attribute of id to match with the corresponding row in gdm.
		INNER JOIN unnest(group_ids) gids(id) ON gids.id = gdm.group_id;

		RETURN QUERY
			-- Finds group_ids, the sum of compressed_reading_rates, compressed_start and compressed_end timestamps from
			-- the compressed_readings table and performs a join.
			SELECT
				gdm.group_id AS group_id,
				SUM(compressed.reading_rate) AS reading_rate,
				compressed.start_timestamp AS start_timestamp,
				compressed.end_timestamp AS end_timestamp
			FROM compressed_readings(meter_ids, from_timestamp, to_timestamp, num_points) compressed
			-- Join the gdm meter_id with the corresponding compressed meter_id.
			INNER JOIN groups_deep_meters gdm ON gdm.meter_id = compressed.meter_id
			-- The previous line would include groups that are parents of the groups we want,
			-- so we remove those groups that are not requested here in the next join.
			INNER JOIN unnest(group_ids) gids(group_id) ON gdm.group_id = gids.group_id
			-- Group the return joined table.
			GROUP BY gdm.group_id, compressed.start_timestamp, compressed.end_timestamp
			ORDER BY gdm.group_id, compressed.start_timestamp;
	END;
$$ LANGUAGE plpgsql;

