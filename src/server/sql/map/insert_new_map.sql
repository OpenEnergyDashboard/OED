/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 INSERT INTO maps(name, displayable, note, filename, modified_date, origin, opposite, map_source, north_angle, max_circle_size_fraction)
 	VALUES (${name}, ${displayable}, ${note}, ${filename}, ${modifiedDate}, ${origin}, ${opposite}, ${mapSource}, ${northAngle}, ${maxCircleSizeFraction})
	RETURNING id;
