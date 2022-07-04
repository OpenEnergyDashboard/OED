/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS conversions (
    source_id INTEGER NOT NULL REFERENCES units(id),
    destination_id INTEGER NOT NULL REFERENCES units(id),
    bidirectional BOOLEAN NOT NULL,
    slope FLOAT,
    intercept FLOAT,
    note TEXT,
    CHECK (source_id != destination_id),
    PRIMARY KEY (source_id, destination_id)
);