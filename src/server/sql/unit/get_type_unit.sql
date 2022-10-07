/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Returns units of type unit that can be seen. Removes ones removed after suffix units created - normally
-- these are the only ones.

SELECT * FROM units WHERE type_of_unit = 'unit'::unit_type and displayable != 'none'::displayable_type;
