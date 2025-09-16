/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE baseline_segments
	SET baseline_value = ${baselineValue},
		start_time = ${startTime},
		end_time = ${endTime},
        calc_start = ${calcStart},
        calc_end = ${calcEnd},
		note = ${note}
	WHERE meter_id = ${meterId}
		AND start_time = ${originalStartTime}::TIMESTAMP
		AND end_time = ${originalEndTime}::TIMESTAMP;