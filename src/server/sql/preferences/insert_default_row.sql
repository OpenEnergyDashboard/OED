/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- This makes sure that two rows cannot be inserted. OED only expects one row.
-- This was happening if a second install was done on the system.
-- Note that you should not check that the same values are there since the 
-- admin can change the value after the row is created.
DO
$$
BEGIN
IF NOT EXISTS(SELECT *
	FROM preferences
	)
	THEN
	INSERT INTO preferences (display_title, default_chart_to_render, default_bar_stacking,
	default_language, default_timezone, default_warning_file_size, default_file_size_limit,
	default_area_normalization, default_area_unit, default_meter_reading_frequency, 
	default_meter_minimum_value, default_meter_maximum_value, default_meter_minimum_date, 
	default_meter_maximum_date, default_meter_reading_gap, default_meter_maximum_errors,
	default_meter_disable_checks, default_help_url) 
	VALUES ('', 'line', FALSE, 'en', NULL, 5, 25, FALSE, 'meters', '00:15:00', 
	-9007199254740991, 9007199254740991, '1970-01-01 00:00:00+00:00', '6970-01-01 00:00:00+00:00',
	0, 75, FALSE, 'https://openenergydashboard.org/');
END IF ;

END;
$$
