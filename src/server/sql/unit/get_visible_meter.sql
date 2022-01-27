/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT *
FROM units 
WHERE (displayable = ${user}
-- Returns units with displayable of all or admin if user is admin 
OR (displayable = 'all' AND ${user} = 'admin'}))
AND unitType = unit_type.meter;