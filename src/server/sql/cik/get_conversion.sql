/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Get conversion for specific row and column in the cik table (same as Cik array).
SELECT * FROM cik WHERE source_id=${sourceId} and destination_id=${destinationId};
