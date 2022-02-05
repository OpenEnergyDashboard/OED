/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- This should avoid an error when the type already exists. This is an issue since
-- OED install stops the creation of database items after this.
DO $$ BEGIN 
	CREATE TYPE unit_represent_type AS ENUM('quantity', 'flow', 'raw', 'unused');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
