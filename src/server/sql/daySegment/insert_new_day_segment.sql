/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
INSERT INTO day_segments(day_id, start_hour, end_hour, slope, intercept, note)
VALUES (${dayId}, ${startHour}, ${endHour}, ${slope}, ${intercept}, ${note});