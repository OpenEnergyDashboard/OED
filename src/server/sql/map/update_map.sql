/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE maps
	SET name = ${name},
		note = ${note},
		displayable = ${displayable},
		filename = ${filename},
		modified_date = ${modifiedDate},
		origin = ${origin},
		opposite = ${opposite},
		map_source = ${mapSource}
	WHERE id = ${id};
