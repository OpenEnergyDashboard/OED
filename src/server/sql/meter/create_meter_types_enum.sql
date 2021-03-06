/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- This should avoid an error when the type already exists. This is an issue since
-- the OED install stops the creation of database items after this.
DO $$ BEGIN
    -- Creates enumerated variable that says what type of meter is used.
    CREATE TYPE meter_type AS ENUM('mamac', 'metasys', 'obvius');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
