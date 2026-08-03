/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO: Research whether external maintenance scripts use this single-row
-- insert. CikVary.insert now performs set-based insertion; remove if unused.

-- Inserts a new conversion into the cik_vary table.
INSERT INTO cik_vary (source_id, destination_id, start_time, end_time, slope, intercept)
VALUES (${sourceId}, ${destinationId}, ${startTime}, ${endTime}, ${slope}, ${intercept});
