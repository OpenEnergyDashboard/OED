/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- This shifts the supplied meter name's readings to the current time in the the provided timezone or UTC if not provided.
-- It was designed to allow developers to shift meter readings to the current time so compare will work.
CREATE OR REPLACE FUNCTION shift_readings (
	-- This is the name (not id) of the meter
	meter_name TEXT,
	-- This is the timezone of the machine you want to see the readings in.
	-- It is given in few letter code such as est, cdt, ...
	-- https://www.postgresql.org/docs/7.2/timezones.html has an older list and
	-- select * from pg_timezone_abbrevs;
	-- will list them all.
	timezone TEXT Default 'utc'
)
	RETURNS INTERVAL
AS $$
DECLARE
	meter_to_use INTEGER;
	shift INTERVAL;
BEGIN
	-- Get the meter id from the name.
	select id into meter_to_use from meters where name = meter_name;
	-- Get the current time in specified timezone round down to the nearest hour (so 11:15 becomes 11:00) and then subract
	-- the latest end time reading. This is the amount of time needed to shift the reading to bring to the current hour.
	select date_trunc('hour', clock_timestamp() at time zone timezone) - max(end_timestamp) into shift from readings where meter_id = meter_to_use;
	-- Shifting all the readings by a set amount has an issue where it can violate the primary key constraint. For example,
	-- if the readings are one hour apart and you shift by one hour then the reading at 12:00-1:00 goes to 1:00-2:00.
	-- However, there is already a reading at 1:00-2:00. Depending on the order that the DB does the update, the violation
	-- can happen. Solutions include a temporary table, disabling the constraint and droping/reinstalling it. I did not want
	-- to disable since this requires modifying the table declaration to allow this and that would impact production use.
	-- I decided to do the drop/reinstall and that follows. It takes a while to add back in the primary key but that was
	-- deemed okay since this is not done a lot and only by developers.
	-- Drop the primary key.
	ALTER TABLE readings DROP CONSTRAINT readings_pkey;
	-- Shift the readings by the amount desired.
	update readings set start_timestamp = start_timestamp + shift, end_timestamp = end_timestamp + shift where meter_id = meter_to_use;
	-- Add the primary key back.
	ALTER TABLE readings ADD PRIMARY KEY (meter_id, start_timestamp);
	-- Return the shift so user knows what was done.
	RETURN shift;
END;
$$ LANGUAGE 'plpgsql';
