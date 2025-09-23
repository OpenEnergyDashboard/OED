/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT MAX(end_time) AS max_end_timestamp
FROM weather_data
WHERE weather_location_id = ${weather_location_id};