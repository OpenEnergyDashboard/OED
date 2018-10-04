/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
SELECT
	meter_id,
	lower(apply_range) as apply_start,
	upper(apply_range) as apply_end,
	lower(calc_range) as calc_start,
	upper(calc_range) as calc_end,
	baseline_value
FROM baseline
WHERE meter_id=${meter_id};
