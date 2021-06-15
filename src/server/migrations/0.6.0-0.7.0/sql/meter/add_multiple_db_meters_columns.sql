/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ALTER TABLE meters
	ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS area REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cumulative BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS cumulative_reset BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS cumulative_reset_start TIME DEFAULT '00:00:00',
    ADD COLUMN IF NOT EXISTS cumulative_reset_end TIME DEFAULT '23:59:59.999999',
    ADD COLUMN IF NOT EXISTS reading_gap REAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reading_variation REAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reading REAL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS start_timestamp TIMESTAMP DEFAULT '0001-01-01 00:00:00',
    ADD COLUMN IF NOT EXISTS end_timestamp TIMESTAMP DEFAULT '0001-01-01 00:00:00'
    ;
 