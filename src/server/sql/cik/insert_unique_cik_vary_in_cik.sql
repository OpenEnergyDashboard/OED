/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- TODO This is an intermediate step where duplicating cik_vary into cik.
-- Really need to put each unique source/destination in the end.
-- *********************************************************
INSERT INTO cik (source_id, destination_id, slope, intercept, start_time, end_time)
SELECT source_id, destination_id, slope, intercept, start_time, end_time
FROM cik_vary
;
-- SELECT DISTINCT(source_id, destination_id)
-- FROM cik_vary
