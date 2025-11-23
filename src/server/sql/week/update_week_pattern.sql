/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
-- Does not return a value

UPDATE week_patterns
    SET week_name = ${weekName},
        note = ${note},
        sunday = ${sunday},
        monday = ${monday},
        tuesday = ${tuesday},
        wednesday = ${wednesday},
        thursday = ${thursday},
        friday = ${friday},
        saturday = ${saturday}
    WHERE  id = ${id};