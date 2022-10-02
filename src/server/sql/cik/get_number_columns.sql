/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Returns the maximum index for any column in cik (Cik).
-- Since columns start at 0 and increase by 1 each time this is the
-- number of columns in the cik table minus 1.
SELECT MAX(column_index) FROM cik;
