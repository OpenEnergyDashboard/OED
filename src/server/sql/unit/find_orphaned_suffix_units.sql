/* This Source Code Form is subject to the terms of the Mozilla Punblic
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

SELECT unit.id, unit.name
FROM units unit
WHERE unit.type_of_unit = 'suffix'::unit_type
AND unit.displayable != 'none'::displayable_type
AND (unit.id = ${sourceId} OR unit.id = ${destinationId} OR unit.id IN (
	SELECT DISTINCT CASE
		WHEN conv.source_id IN (${sourceId}, ${destinationId}) THEN conv.destination_id
		WHEN conv.destination_id IN (${sourceId}, ${destinationId}) THEN conv.source_id
	END
	FROM conversions conv
	WHERE (conv.source_id IN (${sourceId}, ${destinationId}) OR conv.destination_id IN (${sourceId}, ${destinationId}))
))
AND NOT EXISTS (
	SELECT 1 FROM conversions conv
	WHERE (conv.source_id = unit.id OR conv.destination_id = unit.id)
)
LIMIT 100;