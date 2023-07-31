/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO meters(name, url, enabled, displayable, meter_type, default_timezone_meter, gps, identifier,
    note, area, cumulative, cumulative_reset, cumulative_reset_start, cumulative_reset_end, reading_gap, reading_variation, 
    reading_duplication, time_sort, end_only_time, reading, start_timestamp, end_timestamp, previous_end, unit_id,
    default_graphic_unit, area_unit, reading_frequency, min_val, max_val, min_date, max_date, max_error, disable_checks)
VALUES (${name}, ${url}, ${enabled}, ${displayable}, ${type}, ${meterTimezone}, ${gps}, ${identifier},
   ${note}, ${area}, ${cumulative}, ${cumulativeReset}, ${cumulativeResetStart}, ${cumulativeResetEnd},
    ${readingGap}, ${readingVariation}, ${readingDuplication}, ${timeSort}, ${endOnlyTime},
    ${reading}, ${startTimestamp}, ${endTimestamp}, ${previousEnd}, ${unitId}, ${defaultGraphicUnit}, ${areaUnit},
    ${readingFrequency}, ${minVal}, ${maxVal}, ${minDate}, ${maxDate}, ${maxError}, ${disableChecks})
RETURNING id, reading_frequency;
