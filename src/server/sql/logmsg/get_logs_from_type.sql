/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Gets logs in table by date range. This is then ordered by time ascending.
SELECT 
	log_type, log_message as log_msg, log_time
FROM logmsg 
WHERE log_type = ${logType}
ORDER BY log_time ASC;