/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* You cannot alter a type inside a transaction so
 * ALTER TYPE meter_type ADD VALUE 'other';
 * fails during the migration. What follows is the workaround.
 * See https://stackoverflow.com/questions/1771543/adding-a-new-value-to-an-existing-enum-type/10404041#10404041
 * This may not be needed in PostgreSQL 12+ as you can alter a type inside a transaction. */

-- Move the currently named type to a temporary name.
ALTER TYPE meter_type RENAME TO meter_type_temp;
-- Create the type desired with new value, 'other' in this case but need to include old ones.
CREATE TYPE meter_type as enum ('mamac', 'metasys', 'obvius', 'other');
-- Change the column in meters to use the new type with the current rows.
ALTER TABLE meters ALTER COLUMN meter_type TYPE meter_type USING meter_type::text::meter_type;
-- Get rid of the old, temporary type that no longer needed.
DROP TYPE meter_type_temp;
