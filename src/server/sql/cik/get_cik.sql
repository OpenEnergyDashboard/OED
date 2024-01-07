/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Get all ciks through joining cik and units tables.
SELECT U.id AS meter_unit_id, U2.id AS non_meter_unit_id, C.slope, C.intercept
FROM cik AS C
JOIN units AS U ON C.row_index = U.unit_index
JOIN units AS U2 ON C.column_index = U2.unit_index
WHERE U.type_of_unit = 'meter'::unit_type AND U2.type_of_unit != 'meter'::unit_type;
