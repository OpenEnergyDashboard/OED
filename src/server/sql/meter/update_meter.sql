/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE meters
	SET name = ${name},
		ipaddress = ${ipAddress},
		enabled = ${enabled},
		displayable = ${displayable},
		meter_type = ${type},
  		default_timezone_meter = ${meterTimezone},
		gps = ${gps},
		identifier = ${identifier}
	WHERE id = ${id};
