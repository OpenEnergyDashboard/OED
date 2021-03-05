/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE maps
	SET name = ${name},
		displayable = ${displayable},
		note = ${note},
		filename = ${filename},
		modified_date = ${modifiedDate},
		origin = ${origin},
		opposite = ${opposite},
		map_source = ${mapSource},
		north_angle = ${north_angle}
	WHERE id = ${id};
