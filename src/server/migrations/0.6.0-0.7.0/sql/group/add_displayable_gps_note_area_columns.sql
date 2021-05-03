/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ALTER TABLE groups
	ADD COLUMN IF NOT EXISTS displayable BOOLEAN,
    ADD COLUMN IF NOT EXISTS gps POINT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS area REAL DEFAULT NULL;
 