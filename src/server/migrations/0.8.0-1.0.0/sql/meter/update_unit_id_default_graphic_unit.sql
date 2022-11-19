/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Set unit_id to Electric_Utility and default_graphic_unit to kWh for all existing meters.
UPDATE meters
    SET unit_id = (SELECT id FROM units WHERE name = 'Electric_Utility'),
        default_graphic_unit = (SELECT id FROM units WHERE name = 'kWh');