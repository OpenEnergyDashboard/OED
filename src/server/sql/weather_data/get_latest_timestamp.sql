/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT MAX(end_timestamp) AS max_end_timestamp
FROM weather_data
WHERE weather_location_id = ${weatherLocationId};
select max(end_timestamp) as max_end_timestamp from weather_data where weather_location_id=7;