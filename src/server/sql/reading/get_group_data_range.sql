/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets the data range (min and max timestamps) for a group
-- Used for 3D auto-adjustment to determine available data range
SELECT 
	MIN(r.start_timestamp) as min_date,
	MAX(r.end_timestamp) as max_date
FROM readings r
INNER JOIN groups_deep_meters gdm ON r.meter_id = gdm.meter_id
WHERE gdm.group_id = ${groupID};

