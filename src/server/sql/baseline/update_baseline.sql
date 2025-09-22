/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

-- Update overall baseline info using meter ID
UPDATE baselines
	SET
		is_active = ${isActive},
		note = ${note}
	WHERE meter_id = ${meterId};