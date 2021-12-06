/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
    ALTER TABLE preferences
        ADD COLUMN default_warning_file_size FLOAT NOT NULL DEFAULT 5,
        ADD COLUMN default_file_size_limit FLOAT NOT NULL DEFAULT 25;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
