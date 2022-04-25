/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* The following code inserts default units and conversions. 
 * Note that this should happen before using these default values for groups and meters.*/

-- Insert Electric_utility, which is the unit_id for all existing meters.
INSERT INTO units(name, identifier, unit_represent, sec_in_rate, type_of_unit, unit_index, suffix, displayable, preferred_display, note)
VALUES ('Electric_utility', 'Electric_utility', 'quantity'::unit_represent_type, 3600, 'meter'::unit_type, null, '', 'none'::displayable_type, FALSE, 'created during migration')
ON CONFLICT DO NOTHING;

-- Insert kWh, which is the default_graphic_unit for all existing meters/groups.
INSERT INTO units(name, identifier, unit_represent, sec_in_rate, type_of_unit, unit_index, suffix, displayable, preferred_display, note)
VALUES ('kWh', 'kWh', 'quantity'::unit_represent_type, 3600, 'unit'::unit_type, null, '', 'all'::displayable_type, TRUE, 'created during migration')
ON CONFLICT DO NOTHING;

-- Insert the conversion from Electric_utility to kWh. The conversion's slope is 1 since all existing data is in kWh.
INSERT INTO conversions(source_id, destination_id, bidirectional, slope, intercept, note)
VALUES (id_of_units('Electric_utility'), id_of_units('kWh'), FALSE, 1, 0, 'Electric Utility → kWh')
ON CONFLICT DO NOTHING;