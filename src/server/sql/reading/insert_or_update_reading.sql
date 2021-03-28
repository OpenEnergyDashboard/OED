/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Inserts a new meter reading or updates an existing meter value.
INSERT INTO readings (meter_id, reading, start_timestamp, end_timestamp)
VALUES (${meterID}, ${reading}, ${startTimestamp}, ${endTimestamp})
		-- TODO: Deal with conflicts due to overlapping date ranges here.
  ON CONFLICT (meter_id, start_timestamp) DO UPDATE SET reading=${reading};
