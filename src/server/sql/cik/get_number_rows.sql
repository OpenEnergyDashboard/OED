/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Returns the maximum index for any row in cik (Cik).
-- Since rows start at 0 and increase by 1 each time this is the
-- number of rows in the cik table minus 1.
SELECT MAX(row_index) FROM cik;
