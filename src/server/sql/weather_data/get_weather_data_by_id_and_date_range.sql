/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT *
FROM weather_data
WHERE weather_location_id = ${weatherLocationId}
  AND start_timestamp >= ${startTime}
  AND end_timestamp < ${endTime}
ORDER BY start_timestamp ASC;