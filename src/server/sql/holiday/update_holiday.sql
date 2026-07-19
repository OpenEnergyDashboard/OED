/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE holidays
	SET name = ${name},
		start_date = ${startDate},
		location = ${location},
		note = ${note}
	WHERE id = ${id};
