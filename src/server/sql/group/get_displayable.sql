/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO: Research whether external scripts load this query directly. The Group
-- model uses get_displayable_groups.sql for the same result; remove this
-- duplicate if no external consumer depends on its filename.
SELECT * FROM groups WHERE displayable=true;
