/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Return group metadata and cached deep-meter membership in one set-based
-- query. This replaces one groups_deep_meters_cache query per group.
SELECT
	g.*,
	COALESCE(
		array_agg(gdm.meter_id ORDER BY gdm.meter_id)
			FILTER (WHERE gdm.meter_id IS NOT NULL),
		ARRAY[]::INTEGER[]
	) AS deep_meters
FROM groups g
LEFT JOIN groups_deep_meters_cache gdm ON gdm.group_id = g.id
GROUP BY g.id
ORDER BY g.id;
