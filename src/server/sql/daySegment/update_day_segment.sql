/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
-- Does not return a value

UPDATE day_segments
	SET day_id = ${dayId},
		start_hour = ${startHour},
		end_hour = ${endHour},
		slope = ${slope},
		intercept = ${intercept},
		note = ${note}
	WHERE id = ${id};