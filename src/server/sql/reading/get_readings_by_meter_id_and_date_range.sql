/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets raw meter readings by id and date range. This is then ordered by time ascending.
SELECT
  -- Short column names are used to make the data smaller.
  -- There is no meter id as usual for readings since special for raw export.
  reading as r, start_timestamp as s, end_timestamp as e
FROM readings
WHERE meter_id = ${meterID}
  AND start_timestamp >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
	AND end_timestamp <= COALESCE(${endDate}, 'infinity'::TIMESTAMP)
ORDER BY start_timestamp ASC;
