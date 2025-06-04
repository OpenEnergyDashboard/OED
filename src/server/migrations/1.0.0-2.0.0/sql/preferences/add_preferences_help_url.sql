/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add PREFERENCES help url column to the meters table.

-- You need to set default so any existing rows get that value since NOT NULL.
ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS default_help_url TEXT NOT NULL DEFAULT 'https://openenergydashboard.org/'
;
-- Now remove default since not desired.
ALTER TABLE preferences
    ALTER COLUMN default_help_url DROP DEFAULT
;
