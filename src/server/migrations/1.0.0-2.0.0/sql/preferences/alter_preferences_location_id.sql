/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add default_location_id column to the preferences table.

-- Add the column with a default value so existing rows are populated.
ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS default_location_id INTEGER NOT NULL DEFAULT 1;

-- Add the foreign key constraint referencing the location table.
ALTER TABLE preferences
    ADD CONSTRAINT fk_preferences_location
        FOREIGN KEY (default_location_id) REFERENCES location(id);

-- Remove the default since it's no longer needed after existing rows are updated.
ALTER TABLE preferences
    ALTER COLUMN default_location_id DROP DEFAULT;
