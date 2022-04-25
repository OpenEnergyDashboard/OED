/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add unit_id and default_graphic_unit to the meters table.
ALTER TABLE meters
    ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id),
    ADD COLUMN IF NOT EXISTS default_graphic_unit INTEGER REFERENCES units(id);
