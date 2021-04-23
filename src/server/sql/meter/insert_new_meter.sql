/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

<<<<<<< HEAD
INSERT INTO meters(name, ipaddress, enabled, displayable, meter_type, default_timezone_meter, gps, identifier, note, area, cumulative, cumulative_reset, cumulative_reset_start,cumulative_reset_end, previous_day, reading_length, reading_variation, reading, start_timestamp, end_timestamp)
    VALUES (${name}, ${ipAddress}, ${enabled}, ${displayable}, ${type}, ${meterTimezone}, ${gps}, ${identifier}, ${note}, ${area}, ${cumulative}, ${cumulativeReset}, ${cumulativeResetStart}, ${cumulativeResetEnd}, ${previousDay}, ${readingLength}, ${readingVariation}, ${reading}, ${startTimestamp}, ${endTimestamp})
=======
/*
Inserts values into the meters tables and returns the primary key of the meters table.
*/
INSERT INTO meters(name, ipaddress, enabled, displayable, meter_type, default_timezone_meter, gps, identifier)
    VALUES (${name}, ${ipAddress}, ${enabled}, ${displayable}, ${type}, ${meterTimezone}, ${gps}, ${identifier})
>>>>>>> 825fdade5d7ef773c5396c801da99168cd41e8dd
    RETURNING id;
