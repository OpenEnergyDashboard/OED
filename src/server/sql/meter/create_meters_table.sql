/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
Creates a table of meters containing 
primary key (generally set by DB,
the name of a meter used for getting data and currently shown to user,
IP address for meter data,
enabled true if the meter should get data,
displayable true if meter visible to non-admin users,
the meter type,
the time zone for this meter (if null then use site value),
gps location of this meter,
identifier is name that will be shown to user in future
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
	note VARCHAR(500),
	area FLOAT(8) DEFAULT NULL,
	cumulative BOOLEAN DEFAULT false,
	cumulative_reset BOOLEAN DEFAULT false,
	cumulative_reset_start TIME DEFAULT '00:00:00',
	cumulative_reset_end TIME DEFAULT '23:59:50', 
	previous_day BOOLEAN DEFAULT false,
	reading_length TIME,  
	reading_variation TIME DEFAULT '23:59:59',
	reading REAL DEFAULT 0.0,
	start_timestamp TIMESTAMP DEFAULT '0001-01-01 : 00:00:00',
	end_timestamp TIMESTAMP DEFAULT '0001-01-01 : 00:00:00'   
);
