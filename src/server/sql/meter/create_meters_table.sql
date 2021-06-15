/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
Creates a table of meters containing 
primary key (generally set by DB,
name: The name of a meter used for getting data and currently shown to user,
IP addresF: for meter data,
enabled: True if the meter should get data,
displayable: True if meter visible to non-admin users,
meter_type: The meter type,
timezone: The time zone for this meter (if null then use site value),
gps: Location of this meter,
identifier: Is name that will be shown to user in future
note: Notes about the meter
area: Area covered by the meter
cumulative: True if cumulative values can reset back to zero
cumulative_reset: True if pipline is to be reset
cumulative_reset_start: The earliest time of day that a reset can occur
cumulative_reset_end: The latest time of day that a reset can occur
reading_gap: Specify the time in seconds that can exist between the end of the last reading and the start of the next reading
reading_variation: +/- time allowed on length to consider within allowed length
reading: The last reading input for the meter
start_timestamp: Start timestamp of last reading input for this meter
end_timestamp: End timestamp of last reading for this meter
*/
CREATE TABLE IF NOT EXISTS meters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    ipAddress VARCHAR(20),
    enabled BOOLEAN NOT NULL,
    displayable BOOLEAN NOT NULL,
    meter_type meter_type NOT NULL,
    default_timezone_meter TEXT DEFAULT NULL,
    gps POINT DEFAULT NULL,
    identifier TEXT UNIQUE NOT NULL,
    note TEXT,
    area REAL DEFAULT NULL,
    cumulative BOOLEAN DEFAULT false,
    cumulative_reset BOOLEAN DEFAULT false,
    cumulative_reset_start TIME DEFAULT '00:00:00',
    cumulative_reset_end TIME DEFAULT '23:59:59.999999',
    reading_gap REAL DEFAULT 0,
    reading_variation REAL DEFAULT 0,
    reading REAL DEFAULT 0.0,
    start_timestamp TIMESTAMP DEFAULT '0001-01-01 00:00:00',
    end_timestamp TIMESTAMP DEFAULT '0001-01-01 00:00:00'
);
