/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO meters(name, ipaddress, enabled, displayable, meter_type, default_timezone_meter, gps, identifier,
    note, area, cumulative, cumulative_reset, cumulative_reset_start, cumulative_reset_end, reading_gap,
    reading_variation, reading_duplication, time_sort, end_only_time, reading, start_timestamp, end_timestamp)
VALUES (${name}, ${ipAddress}, ${enabled}, ${displayable}, ${type}, ${meterTimezone}, ${gps}, ${identifier},
    ${note}, ${area}, ${cumulative}, ${cumulativeReset}, ${cumulativeResetStart}, ${cumulativeResetEnd},
    ${readingGap}, ${readingVariation}, ${readingDuplication}, ${timeSort}, ${endOnlyTime},
    ${reading}, ${startTimestamp}, ${endTimestamp})
RETURNING id;
