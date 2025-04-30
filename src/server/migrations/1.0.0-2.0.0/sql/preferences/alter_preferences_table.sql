/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This should not be needed for a normal migration but is if did previous
// change to v1.0.0. It should be safe so leaving.

ALTER TABLE units
    DROP COLUMN IF EXISTS default_meter_minimum_value,
    DROP COLUMN IF EXISTS default_meter_maximum_value,
    DROP COLUMN IF EXISTS default_meter_disable_checks
;
