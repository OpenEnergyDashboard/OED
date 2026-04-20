/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE holiday_instance
	SET name = ${name},
		note = ${note},
		holiday_id = ${holidayId},
		day_pattern_id = ${dayPatternId}
	WHERE id = ${id};
