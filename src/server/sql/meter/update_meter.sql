/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE meters
	SET name = ${name},
		url = ${url},
		enabled = ${enabled},
		displayable = ${displayable},
		meter_type = ${type},
  		default_timezone_meter = ${meterTimezone},
		gps = ${gps},
		identifier = ${identifier},
		note = ${note},
		area = ${area},
		cumulative = ${cumulative},
		cumulative_reset = ${cumulativeReset},
		cumulative_reset_start = ${cumulativeResetStart},
		cumulative_reset_end = ${cumulativeResetEnd},
		reading_gap = ${readingGap},
		reading_variation = ${readingVariation},
		reading_duplication = ${readingDuplication},
		time_sort = ${timeSort},
		end_only_time = ${endOnlyTime},
		reading = ${reading},
		start_timestamp = ${startTimestamp},
		end_timestamp = ${endTimestamp},
		previous_end = ${previousEnd},
		unit_id = ${unitId},
		default_graphic_unit = ${defaultGraphicUnit},
		area_unit = ${areaUnit},
		reading_frequency = ${readingFrequency}
	WHERE id = ${id}
	RETURNING reading_frequency;

