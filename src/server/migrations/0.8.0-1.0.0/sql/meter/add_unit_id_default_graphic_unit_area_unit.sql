/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Add unit_id, default_graphic_unit, and area_unit to the meters table.
UPDATE meters SET area = 0 WHERE area IS NULL;
ALTER TABLE meters
    ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id),
    ADD COLUMN IF NOT EXISTS default_graphic_unit INTEGER REFERENCES units(id),
    ADD COLUMN IF NOT EXISTS area_unit area_unit_type NOT NULL DEFAULT 'none',
    ALTER COLUMN area SET NOT NULL,
    ALTER COLUMN area SET DEFAULT 0,
    ADD CONSTRAINT meter_area_check CHECK (area >= 0);
