/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

DO $$ BEGIN
    CREATE TYPE language_type AS ENUM('en', 'fr', 'es');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;