/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
-- added functionality for the start_time to be updated, may need to adjust later

UPDATE conversion_segments
	SET week_patterns_id = ${weekPatternsId},
		slope = ${slope},
		intercept = ${intercept},
		start_time = ${startTime},
		end_time = ${endTime},
		note = ${note}
	WHERE source_id = ${sourceId} AND destination_id = ${destinationId} AND start_time::TEXT = ${originalStartTime} AND end_time::TEXT = ${originalEndTime};