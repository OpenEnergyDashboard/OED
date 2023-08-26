* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add meter pipeline check columns to the meters table.
ALTER TABLE meters
    ADD COLUMN IF NOT EXISTS min_val FLOAT NOT NULL DEFAULT -9007199254740991 CHECK (min_val::FLOAT >= -9007199254740991),
    ADD COLUMN IF NOT EXISTS max_val FLOAT NOT NULL DEFAULT 9007199254740991 CHECK (max_val::FLOAT <= 9007199254740991),
    ADD COLUMN IF NOT EXISTS min_date TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:00+00:00',
    ADD COLUMN IF NOT EXISTS max_date TIMESTAMP NOT NULL DEFAULT '6970-01-01 00:00:00+00:00',
    ADD COLUMN IF NOT EXISTS max_error INTEGER NOT NULL DEFAULT 75,
    ADD COLUMN IF NOT EXISTS disable_checks BOOLEAN DEFAULT false
;
