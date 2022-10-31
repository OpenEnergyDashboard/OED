/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Change to be a string.
ALTER TABLE meters ALTER COLUMN start_timestamp TYPE VARCHAR(50);
ALTER TABLE meters ALTER COLUMN end_timestamp TYPE VARCHAR(50);
-- Add previous_end
DO $$ BEGIN
    ALTER TABLE meters ADD COLUMN previous_end TIMESTAMP DEFAULT '1970-01-01 00:00:00';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
