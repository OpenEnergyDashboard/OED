/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
    ALTER TABLE preferences
        ADD COLUMN default_area_normalization BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN default_area_unit area_unit_type NOT NULL DEFAULT 'meters';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
