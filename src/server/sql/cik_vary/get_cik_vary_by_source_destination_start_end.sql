/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO: Research whether this lookup is part of a supported external API. Its
-- model method has no internal callers and currently references a misspelled
-- path; remove both if no external caller needs point-in-time lookup.

-- Get conversion for specific source, destination, and time range in cik_vary table.
SELECT * FROM cik_vary WHERE source_id=${sourceId} AND destination_id=${destinationId} AND start_time<=${queryTime} AND end_time>${queryTime};
