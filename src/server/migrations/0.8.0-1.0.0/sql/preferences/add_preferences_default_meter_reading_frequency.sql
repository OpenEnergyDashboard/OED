/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
    ALTER TABLE preferences
        ADD COLUMN default_meter_reading_frequency INTERVAL NOT NULL DEFAULT '00:15:00';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
