/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


DO $$ BEGIN 
	CREATE TYPE disable_checks_type AS ENUM('reject_disable', 'reject_bad', 'reject_all', 'reject_none');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
