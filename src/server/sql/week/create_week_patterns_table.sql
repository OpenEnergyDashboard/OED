/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
CREATE TABLE IF NOT EXISTS week_patterns (
    id SERIAL PRIMARY KEY,
    week_name TEXT NOT NULL,
    note TEXT,
    sunday INTEGER NOT NULL REFERENCES day_patterns(id),
    monday INTEGER NOT NULL REFERENCES day_patterns(id),
    tuesday INTEGER NOT NULL REFERENCES day_patterns(id),
    wednesday INTEGER NOT NULL REFERENCES day_patterns(id),
    thursday INTEGER NOT NULL REFERENCES day_patterns(id),
    friday INTEGER NOT NULL REFERENCES day_patterns(id),
    saturday INTEGER NOT NULL REFERENCES day_patterns(id)
);