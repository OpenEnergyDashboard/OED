/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
SELECT m.* FROM
	groups_immediate_meters gim
	INNER JOIN meters m
		ON gim.meter_id = m.id
WHERE gim.group_id = ${id};
