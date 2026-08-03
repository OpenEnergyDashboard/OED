/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO: Research whether external maintenance scripts use this query. No
-- in-repository JavaScript loads it; remove it if there are no external users.

-- Get all conversions in cik table.
SELECT * FROM cik;
