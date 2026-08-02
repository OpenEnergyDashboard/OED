/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Aggregate each relationship independently. Joining both relationship tables
-- before aggregating produces a child-meter x child-group intermediate result
-- for every group, which becomes expensive for groups with many children.
SELECT
	g.id AS group_id,
	COALESCE(meters.child_meters, ARRAY[]::INTEGER[]) AS child_meters,
	COALESCE(child_groups.child_groups, ARRAY[]::INTEGER[]) AS child_groups
FROM groups g
LEFT JOIN (
	SELECT group_id, array_agg(meter_id ORDER BY meter_id) AS child_meters
	FROM groups_immediate_meters
	GROUP BY group_id
) meters ON meters.group_id = g.id
LEFT JOIN (
	SELECT parent_id, array_agg(child_id ORDER BY child_id) AS child_groups
	FROM groups_immediate_children
	GROUP BY parent_id
) child_groups ON child_groups.parent_id = g.id
ORDER BY g.id;
