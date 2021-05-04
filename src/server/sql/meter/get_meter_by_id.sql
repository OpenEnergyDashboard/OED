/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT id, name, ipaddress, enabled, displayable, meter_type, default_timezone_meter, gps, identifier,
    note, area, cumulative, cumulative_reset, cumulative_reset_start, cumulative_reset_end,
    reading_length, reading_variation, reading, start_timestamp, end_timestamp
FROM meters
WHERE id=${id};
