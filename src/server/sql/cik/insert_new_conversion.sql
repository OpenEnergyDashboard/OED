/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Inserts a new conversion into the cik table.
INSERT INTO cik (source_id, destination_id, slope, intercept)
VALUES (${sourceId}, ${destinationId}, ${slope}, ${intercept});
