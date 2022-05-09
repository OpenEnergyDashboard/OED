/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Set the reading's type to float. 
-- Since daily_readings and hourly_readings views use reading values, this must happen after dropping these views.
ALTER TABLE readings ALTER COLUMN reading TYPE FLOAT;