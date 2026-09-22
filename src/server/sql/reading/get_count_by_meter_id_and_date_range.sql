/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets number of meter readings by id and date range.
SELECT
  COUNT(*)
FROM readings
WHERE meter_id = ${meterID}
  AND start_timestamp >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
	AND end_timestamp <= COALESCE(${endDate}, 'infinity'::TIMESTAMP);
