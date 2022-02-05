/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT *
FROM units
WHERE (unit_type = 'unit' OR unit_type = 'suffix')
-- Returns unit with properly displayable_type. 
-- If user is admin then return units with displayable of all or admin if user is admin.
AND (displayable_type = ${user} OR (displayable_type = 'all' AND ${user} = 'admin'));