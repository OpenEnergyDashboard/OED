* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add PREFERENCES pipeline check columns to the meters table.

-- You need to set default so any existing rows get that value since NOT NULL.
ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS default_meter_minimum_value FLOAT NOT NULL DEFAULT -9007199254740991,
	ADD COLUMN IF NOT EXISTS default_meter_maximum_value FLOAT NOT NULL DEFAULT 9007199254740991,
	ADD COLUMN IF NOT EXISTS default_meter_minimum_date TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:00+00:00',
    ADD COLUMN IF NOT EXISTS default_meter_maximum_date TIMESTAMP NOT NULL DEFAULT '6970-01-01 00:00:00+00:00',
	ADD COLUMN IF NOT EXISTS default_meter_reading_gap REAL NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS default_meter_maximum_errors INTEGER NOT NULL DEFAULT 75,
	ADD COLUMN IF NOT EXISTS default_meter_disable_checks BOOLEAN NOT NULL DEFAULT false
;
-- Now remove default since not desired.
ALTER TABLE preferences
    ALTER COLUMN default_meter_minimum_value DROP DEFAULT,
	ALTER COLUMN default_meter_maximum_value DROP DEFAULT,
	ALTER COLUMN default_meter_minimum_date DROP DEFAULT,
    ALTER COLUMN default_meter_maximum_date DROP DEFAULT,
	ALTER COLUMN default_meter_reading_gap DROP DEFAULT,
    ALTER COLUMN default_meter_maximum_errors DROP DEFAULT,
    ALTER COLUMN default_meter_disable_checks DROP DEFAULT
;
