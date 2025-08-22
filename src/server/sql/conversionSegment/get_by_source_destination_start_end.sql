/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
SELECT 
	source_id,
	destination_id,
	week_patterns_id,
	slope,
	intercept,
	-- Cast to text to preserve '-infinity' and 'infinity values, otherwise, JavaScript will convert these values to null
	start_time::TEXT AS start_time,
	end_time::TEXT AS end_time,
	note
FROM conversion_segments
WHERE source_id = ${sourceId}
	AND destination_id = ${destinationId}
	AND start_time = ${startTime}
	AND end_time = ${endTime}
-- Cast back to timestamp so ordering works correctly
ORDER BY start_time::TIMESTAMP ASC;