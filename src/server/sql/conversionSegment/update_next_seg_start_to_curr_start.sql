/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
UPDATE conversion_segments
	SET start_time = ${startTime}
	WHERE source_id = ${sourceId}
		AND destination_id = ${destinationId}
		AND start_time = ${endTime};