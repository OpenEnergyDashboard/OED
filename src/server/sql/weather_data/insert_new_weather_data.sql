/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
  INSERT INTO weather_data (weather_location_id, start_time, end_time, temperature)
  VALUES (${weatherLocationId}, '${startTime}', '${endTime}', ${temperature});
END $$;
