/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ALTER TABLE units
    ADD COLUMN IF NOT EXISTS min_val FLOAT NOT NULL DEFAULT -9007199254740991,
    ADD COLUMN IF NOT EXISTS max_val FLOAT NOT NULL DEFAULT 9007199254740991 CHECK (max_val >= min_val),
    ADD COLUMN IF NOT EXISTS disable_checks disable_checks_type NOT NULL DEFAULT 'reject_all'
;
