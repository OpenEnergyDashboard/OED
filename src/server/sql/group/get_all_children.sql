/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Returns a row for each group with the id, an array of the immediate children meters
-- and and array of the immediate group children.
-- Note it return an array with one entry of null if no child or group meters.
SELECT g.id as group_id, array_agg(DISTINCT gim.meter_id) as child_meters, array_agg(DISTINCT gic.child_id) as child_groups
FROM groups g
-- Use LEFT OUTER JOIN so get result for all groups.
LEFT OUTER JOIN groups_immediate_meters gim ON g.id = gim.group_id
LEFT OUTER JOIN groups_immediate_children gic ON g.id = gic.parent_id
GROUP BY g.id;
