/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Function to find the id associated with a unit name.
CREATE OR REPLACE FUNCTION id_of_units(unit_name VARCHAR) RETURNS INTEGER AS $$
    SELECT id FROM units WHERE name = unit_name;
$$ LANGUAGE SQL;

ALTER TABLE meters
    ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id) DEFAULT id_of_units('kWh'),
    ADD COLUMN IF NOT EXISTS default_graphic_unit INTEGER REFERENCES units(id) DEFAULT id_of_units('kWh');
