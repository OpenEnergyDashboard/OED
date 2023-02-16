/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- TODO consider moving this to 1.0, even though area normalization is planned as a 1.1 feature.
-- Move the currently named type to a temporary name.
ALTER TYPE unit_type RENAME TO unit_type_temp;
-- Create the type desired with new value, 'other' in this case but need to include old ones.
CREATE TYPE unit_type as enum ('unit', 'meter', 'suffix', 'area');
-- Change the column in meters to use the new type with the current rows.
ALTER TABLE meters ALTER COLUMN unit_type TYPE unit_type USING unit_type::text::unit_type;
-- Get rid of the old, temporary type that no longer needed.
DROP TYPE unit_type_temp;