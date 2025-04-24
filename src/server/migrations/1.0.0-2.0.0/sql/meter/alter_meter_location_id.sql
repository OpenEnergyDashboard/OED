/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add location_id column and foreign key constraint to meters table
ALTER TABLE meters
    ADD COLUMN IF NOT EXISTS location_id INTEGER DEFAULT 1,
    ADD CONSTRAINT fk_meters_location
        FOREIGN KEY (location_id) REFERENCES location(id);
