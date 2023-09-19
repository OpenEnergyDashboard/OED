/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
Creates a table of meters containing 
primary key (generally set by DB,
name: The name of a meter used for getting data and currently shown to user,
url: for meter data,
enabled: True if the meter should get data,
displayable: True if meter visible to non-admin users,
meter_type: The meter type,
timezone: The time zone for this meter (if null then use site value),
gps: Location of this meter,
identifier: Is name that will be shown to user in future
note: Notes about the meter
area: Area covered by the meter
cumulative: True if cumulative values can reset back to zero
cumulative_reset: True if pipeline is to be reset
cumulative_reset_start: The earliest time of day that a reset can occur
cumulative_reset_end: The latest time of day that a reset can occur
reading_gap: Specify the time in seconds that can exist between the end of the last reading and the start of the next reading
reading_variation: +/- time allowed on length to consider within allowed length
reading_duplication: The number of times each reading is given where 1 means only once and is the default.
time_sort: 'increasing' for reading provided in increasing time and 'decreasing' if other way. Default is 'increasing'
end_only_time: true if only an end time is given for each reading and false by default
reading: The last reading input for the meter
start_timestamp: Start timestamp of last reading input for this meter
end_timestamp: End timestamp of last reading for this meter
previous_end: This is used if the readings are split during the processing of crossing away from DST. moment(0) if not this case.
unit_id: The foreign key to the unit table. The meter receives data and points to this unit in the graph
default_graphic_unit: The foreign key to the unit table represents the preferred unit to display this meter
area_unit: The area unit enum
reading_frequency: The time between readings
*/
CREATE TABLE IF NOT EXISTS meters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(name) >= 1),
    url VARCHAR(400),
    enabled BOOLEAN NOT NULL,
    displayable BOOLEAN NOT NULL,
    meter_type meter_type NOT NULL,
    default_timezone_meter TEXT DEFAULT NULL CHECK (default_timezone_meter IS NULL OR check_timezone(default_timezone_meter::TEXT) = true),
    gps POINT DEFAULT NULL,
    identifier TEXT UNIQUE NOT NULL CHECK (char_length(identifier) >= 1),
    note TEXT,
    area REAL NOT NULL DEFAULT 0 CHECK (area >= 0),
    cumulative BOOLEAN DEFAULT false,
    cumulative_reset BOOLEAN DEFAULT false,
    cumulative_reset_start TIME DEFAULT '00:00:00',
    cumulative_reset_end TIME DEFAULT '23:59:59.999999',
    reading_gap REAL DEFAULT 0,
    reading_variation REAL DEFAULT 0,
    reading_duplication INTEGER DEFAULT 1 CHECK (reading_duplication::INTEGER >= 1 AND reading_duplication::INTEGER <= 9),
    time_sort TEXT DEFAULT 'increasing' CHECK (time_sort::TEXT = 'increasing' OR time_sort::TEXT = 'decreasing'),
    end_only_time BOOLEAN DEFAULT false,
    reading FLOAT DEFAULT 0.0,
    -- The next two are strings because src/server/models/patch-moment-type.js is set up to automatically convert every moment
    -- object back to UTC which removes the needed timezone information. This is the only place we need the timezone
    -- so all others in the DB are moment time objects.
    start_timestamp VARCHAR(50) DEFAULT '1970-01-01 00:00:00+00:00',
    end_timestamp VARCHAR(50) DEFAULT '1970-01-01 00:00:00+00:00',
    previous_end TIMESTAMP DEFAULT '1970-01-01 00:00:00',
    unit_id INTEGER REFERENCES units(id),
    default_graphic_unit INTEGER REFERENCES units(id),
    area_unit area_unit_type NOT NULL DEFAULT 'none',
    reading_frequency INTERVAL NOT NULL DEFAULT '00:15:00'
);
