/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
INSERT INTO baseline (meter_id, apply_range, calc_range, baseline_value)
VALUES (${meter_id},
				tsrange(${apply_start}, ${apply_end}, '[]'),
				tsrange(${calc_start}, ${calc_end}, '[]'),
				(SELECT reading_rate FROM get_average_reading(ARRAY [${meter_id}], ${calc_start}, ${calc_end})))
RETURNING baseline_value;
