/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT *
FROM units
WHERE type_of_unit = 'meter'
-- Returns unit with properly displayable. 
-- If user is admin then return units with displayable of all or admin if user is admin.
AND (displayable = ${user} OR (displayable = 'all' AND ${user} = 'admin'));
