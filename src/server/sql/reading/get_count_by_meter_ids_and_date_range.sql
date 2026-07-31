/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Count all requested meters together to avoid one database query per meter.
SELECT COUNT(*)
FROM readings
WHERE meter_id = ANY(${meterIDs}::INTEGER[])
  AND start_timestamp >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
  AND end_timestamp <= COALESCE(${endDate}, 'infinity'::TIMESTAMP);
