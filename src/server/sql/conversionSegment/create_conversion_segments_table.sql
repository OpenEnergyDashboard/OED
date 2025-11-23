/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
CREATE TABLE IF NOT EXISTS conversion_segments (
    source_id INTEGER NOT NULL REFERENCES units(id),
    destination_id INTEGER NOT NULL REFERENCES units(id),
    week_patterns_id INTEGER REFERENCES week_patterns(id),
    slope FLOAT,
    intercept FLOAT,
    start_time TIMESTAMP DEFAULT '-infinity',
    end_time TIMESTAMP DEFAULT 'infinity',
    note TEXT,
    FOREIGN KEY (source_id, destination_id) REFERENCES conversions(source_id, destination_id),
    PRIMARY KEY (source_id, destination_id, start_time)
);