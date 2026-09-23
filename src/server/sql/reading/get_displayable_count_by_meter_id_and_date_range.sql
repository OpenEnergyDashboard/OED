/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets number of meter readings by id and date range. Returns 0 if the meter is not
-- displayable, the same as if the meter id does not exist.
SELECT
  COUNT(*)
FROM readings
INNER JOIN meters ON meters.id = readings.meter_id
WHERE readings.meter_id = ${meterID}
  AND meters.displayable = TRUE
  AND readings.start_timestamp >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
	AND readings.end_timestamp <= COALESCE(${endDate}, 'infinity'::TIMESTAMP);
