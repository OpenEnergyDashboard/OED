/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- Set default_graphic_unit of existing groups to kWh.
UPDATE groups SET default_graphic_unit = (SELECT id FROM units WHERE name = 'kWh');
