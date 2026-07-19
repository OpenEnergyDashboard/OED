/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO holiday_instance (
	name,
	note,
	holiday_id,
	day_pattern_id
) VALUES (
	${name},
	${note},
	${holidayId},
	${dayPatternId}
)
RETURNING id;
