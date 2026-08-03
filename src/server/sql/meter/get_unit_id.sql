/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO: Research whether external scripts load this query directly. No
-- in-repository model or service references it; remove it if unused.

SELECT unit_id FROM meters WHERE id=${meterId};
