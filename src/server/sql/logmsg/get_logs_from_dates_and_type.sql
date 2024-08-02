/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets logs in table by date range. This is then ordered by time ascending.
SELECT 
	-- Short column names for smaller data.
	log_type as p, log_message as m, log_time as i
FROM logmsg 
WHERE log_type = ${logType}
	AND log_time >= COALESCE(${startDate}, '-infinity'::TIMESTAMP)
	AND log_time <= COALESCE(${endDate}, 'infinity'::TIMESTAMP)
ORDER BY log_time ASC;