/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT
	h.start_date,
	COUNT(*) AS holiday_count
FROM holiday_group_members hgm
	INNER JOIN holiday_instance hi ON hgm.holiday_instance_id = hi.id
	INNER JOIN holidays h ON hi.holiday_id = h.id
WHERE hgm.holiday_instance_group_id = ${holidayInstanceGroupId}
GROUP BY h.start_date
ORDER BY h.start_date;
