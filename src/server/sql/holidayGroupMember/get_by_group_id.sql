/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT
	hgm.holiday_instance_group_id,
	hgm.holiday_instance_id,
	hi.name AS holiday_instance_name,
	hi.holiday_id,
	hi.day_pattern_id,
	h.name AS holiday_name,
	h.start_date,
	h.location,
	dp.name AS day_pattern_name
FROM holiday_group_members hgm
	INNER JOIN holiday_instance hi ON hgm.holiday_instance_id = hi.id
	INNER JOIN holidays h ON hi.holiday_id = h.id
	INNER JOIN day_patterns dp ON hi.day_pattern_id = dp.id
WHERE hgm.holiday_instance_group_id = ${holidayInstanceGroupId}
ORDER BY h.start_date, h.name, hi.name;
