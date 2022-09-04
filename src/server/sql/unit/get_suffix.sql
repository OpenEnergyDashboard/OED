/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Returns units where there is a suffix string. Include ones that not displayable
-- because set to none after processed.

SELECT * FROM units WHERE suffix != '';
