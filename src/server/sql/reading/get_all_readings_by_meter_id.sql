/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets all meter readings from the readings table and orders them by ascending time.
SELECT
  meter_id, reading, start_timestamp, end_timestamp
FROM readings
WHERE meter_id = ${meterID}
ORDER BY start_timestamp ASC;
