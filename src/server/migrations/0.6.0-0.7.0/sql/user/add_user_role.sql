/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM('admin', 'csv', 'obvius', 'export');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users prior to this version were admin. This sets them to admin and then removes that default.
ALTER TABLE users
	ADD COLUMN IF NOT EXISTS role user_type NOT NULL DEFAULT 'admin';
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
