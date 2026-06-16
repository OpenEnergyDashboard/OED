/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

CREATE TABLE IF NOT EXISTS weather_data (
    weather_location_id INTEGER NOT NULL,
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP NOT NULL,
    temperature FLOAT NOT NULL,
    CHECK (start_timestamp < end_timestamp),
    PRIMARY KEY (weather_location_id, start_timestamp),
    FOREIGN KEY (weather_location_id) REFERENCES weather_location(id)
);