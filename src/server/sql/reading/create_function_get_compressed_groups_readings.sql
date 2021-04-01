/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
	This function gets compressed meter readings over specified interval.
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
		-- Create a temporary variable "array_agg" that has an attribute of meter_id from the groups_deep_meters table.
		-- 'array_agg' will iterate over all the meters in all the selected groups and put them in the meter_ids array.
		SELECT array_agg(meter_id)
		INTO meter_ids
		FROM groups_deep_meters gdm
		-- Create a temporary variable "gids" that has an attribute of id to match with the corresponding row in gdm.
		INNER JOIN unnest(group_ids) gids(id) ON gids.id = gdm.group_id;

		RETURN QUERY
			-- Find group_ids, the sum of compressed_reading_rates, compressed_start and compressed_end timestamps from
			-- the output of the compressed_readings function and perform a join.
			SELECT
				gdm.group_id AS group_id,
				SUM(compressed.reading_rate) AS reading_rate,
				compressed.start_timestamp AS start_timestamp,
				compressed.end_timestamp AS end_timestamp
			FROM compressed_readings(meter_ids, from_timestamp, to_timestamp, num_points) compressed
			-- Join the gdm meter_id with the corresponding compressed meter_id.
			INNER JOIN groups_deep_meters gdm ON gdm.meter_id = compressed.meter_id
			-- The previous line would include groups that are parents of the groups we want,
			-- so we only select those groups that were in the group_ids array.
			INNER JOIN unnest(group_ids) gids(group_id) ON gdm.group_id = gids.group_id
			-- Group the joined table.
			GROUP by gdm.group_id, compressed.start_timestamp, compressed.end_timestamp
			ORDER BY gdm.group_id, compressed.start_timestamp;
	END;
$$ LANGUAGE plpgsql;

