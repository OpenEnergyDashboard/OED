/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Returns the maximum row index for any meter.
-- Since rows start at 0 and increase by 1 each time this is the
-- number of rows - 1 desired in the pik table.
-- This can differ from the number of rows in cik if there is a unit
-- that has no conversion that is a higher index than one with a conversion.
SELECT MAX(unit_index) FROM units WHERE type_of_unit = 'meter'::unit_type;
