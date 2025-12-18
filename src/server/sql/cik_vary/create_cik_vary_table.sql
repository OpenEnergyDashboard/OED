/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create cik_vary table for time-varying conversions
CREATE TABLE IF NOT EXISTS cik_vary (
    source_id INTEGER REFERENCES units(id),
    destination_id INTEGER REFERENCES units(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    slope FLOAT NOT NULL,
    intercept FLOAT NOT NULL,
    PRIMARY KEY (source_id, destination_id, start_time, end_time)
);
