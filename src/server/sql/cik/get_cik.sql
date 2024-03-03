/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Get all ciks through joining cik and units tables.
SELECT source_id AS meter_unit_id, destination_id AS non_meter_unit_id, slope, intercept
FROM cik
;
