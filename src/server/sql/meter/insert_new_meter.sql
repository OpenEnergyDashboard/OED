/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO meters(name, ipaddress, enabled, displayable, meter_type, gps)
    VALUES (${name}, ${ipAddress}, ${enabled}, ${displayable}, ${type}, ${gps})
    RETURNING id;
