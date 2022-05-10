/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Set the reading's type to float. 
-- Since daily_readings and hourly_readings views use reading values, this must happen after dropping these views.

-- These comments are only really needed if doing the migrations manually.
-- Note that if you already have the old views then do the steps in
-- src/server/migrations/0.8.0-1.0.0/sql/readings/drop_old_views.sql
-- If you already have the new views then you will need to do:
-- DROP MATERIALIZED VIEW daily_readings_unit;
-- DROP MATERIALIZED VIEW hourly_readings_unit;
-- You can check if a view exists with:
-- \d hourly_readings_unit or any name of a view.
-- Once this is done you need to refresh the reading views so you can graph again.
ALTER TABLE readings ALTER COLUMN reading TYPE FLOAT;