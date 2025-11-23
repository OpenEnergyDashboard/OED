/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
-- Insert a new week pattern into the week table

INSERT INTO week_patterns (
    week_name, 
    note, 
    sunday, 
    monday, 
    tuesday, 
    wednesday, 
    thursday, 
    friday, 
    saturday
) VALUES (
    ${weekName}, 
    ${note}, 
    ${sunday}, 
    ${monday}, 
    ${tuesday}, 
    ${wednesday}, 
    ${thursday}, 
    ${friday}, 
    ${saturday}
)
RETURNING id;