/* This Source Code Form is subject to the terms of the Mozilla Punblic
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT unit.id, unit.name
FROM units unit
WHERE unit.displayable != 'none'::displayable_type
AND NOT EXISTS (
	SELECT 1 FROM conversions conv
	WHERE (conv.source_id = unit.id OR conv.destination_id = unit.id)
)
LIMIT 100;