/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Get all cik_vary entries, and rename source_id to meter_unit_id and destination_id to non_meter_unit_id
SELECT source_id AS meter_unit_id, destination_id AS non_meter_unit_id, start_time, end_time, slope, intercept
FROM cik_vary;
