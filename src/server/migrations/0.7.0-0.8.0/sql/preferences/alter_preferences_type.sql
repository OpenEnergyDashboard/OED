/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- See 0.6.0-0.7.0/add_meter_type.sql for more information on this migration.

-- Move the currently named type to a temporary name.
ALTER TYPE graph_type RENAME TO graph_type_temp;
-- Create the type desired with new value, 'map' in this case but need to include old ones.
CREATE TYPE graph_type as enum ('line', 'bar', 'compare', 'map');
-- Change the column in meters to use the new type with the current rows.
ALTER TABLE preferences ALTER COLUMN default_chart_to_render TYPE graph_type USING default_chart_to_render::text::graph_type;
-- Get rid of the old, temporary type that no longer needed.
DROP TYPE graph_type_temp;
