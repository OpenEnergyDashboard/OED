/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Select all baseline segments with corresponding meter ID
SELECT 
	meter_id,
	baseline_value,
	-- Cast to text to preserve '-infinity' and 'infinity values, otherwise, JavaScript will convert these values to null
	start_time::TEXT AS start_time,
	end_time::TEXT AS end_time,
    calc_start,
    calc_end,
	note
FROM baseline_segments WHERE meter_id = ${meterId} 
ORDER BY start_time::TIMESTAMP ASC;