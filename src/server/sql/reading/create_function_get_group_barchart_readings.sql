/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
	This function gets a group of barchart readings and returns a table of those group readings.
*/
CREATE OR REPLACE FUNCTION barchart_group_readings(
	group_ids INTEGER[],
	duration INTERVAL,
	from_timestamp TIMESTAMP = '-infinity',
	to_timestamp TIMESTAMP = 'infinity')
	-- Returns a table of ids, reading sums, and intervals as columns.
	RETURNS TABLE(group_ID INTEGER, reading_sum INTEGER, start_timestamp TIMESTAMP, end_timestamp TIMESTAMP) AS $$
	DECLARE
		-- Creates an array of meter ids.
		meter_ids INTEGER[];
	BEGIN
		-- Creates a temporary variable "array_agg" that has an attribute of meter_id from the groups_deep_meters table,
		-- then put array_agg into the array meter_ids.
		SELECT array_agg(meter_id)
		INTO meter_ids
		FROM groups_deep_meters gdm
			-- Creates a temporary variable "gids" with attribute meter_id that is match with the corresponding gdm.group_id.
			INNER JOIN unnest(group_ids) gids(id) ON gids.id = gdm.group_id;

		RETURN QUERY
		-- Finds group_ids, the sum of compressed_reading_rates, compressed_start and compressed_end timestamps from
		-- the barchart_readings table and performs a join.
		SELECT
			gdm.group_id AS group_ID,
			SUM(compressed.reading_sum)::INTEGER AS reading_sum,
			compressed.start_timestamp AS start_timestamp,
			compressed.end_timestamp AS end_timestamp
		FROM barchart_readings(meter_ids, duration, from_timestamp, to_timestamp) compressed
			-- Joins gdm.meter_id with the corresponding compressed.meter_id.
			INNER JOIN groups_deep_meters gdm ON gdm.meter_id = compressed.meter_id
			-- The previous line would include groups that are parents of the groups we want,
			-- so we remove those groups that are not requested here in the next join.
			INNER JOIN unnest(group_ids) gids(group_id) ON gdm.group_id = gids.group_id
		GROUP by gdm.group_id, compressed.start_timestamp, compressed.end_timestamp;
	END;
$$ LANGUAGE plpgsql;
