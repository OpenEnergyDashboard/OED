/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
INSERT INTO conversion_segments(source_id, destination_id, week_patterns_id, slope, intercept, start_time, end_time, note)
VALUES (${sourceId}, ${destinationId}, ${weekPatternsId}, ${slope}, ${intercept}, ${startTime}, ${endTime}, ${note});