/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE groups
	SET name = ${name},
		displayable = ${displayable},
		gps = ${gps},
		note = ${note},
		area = ${area},
		default_graphic_unit = ${defaultGraphicUnit},
		area_unit = ${areaUnit}
	WHERE id = ${id};