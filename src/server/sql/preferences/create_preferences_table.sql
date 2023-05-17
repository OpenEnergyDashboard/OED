/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

-- create preferences table
CREATE TABLE IF NOT EXISTS preferences (
	id SERIAL PRIMARY KEY,
	display_title VARCHAR(50) NOT NULL,
	default_chart_to_render graph_type NOT NULL,
	default_bar_stacking BOOLEAN NOT NULL,
	default_language language_type NOT NULL,
	default_timezone TEXT DEFAULT NULL,
	default_warning_file_size FLOAT NOT NULL,
	default_file_size_limit FLOAT NOT NULL,
	default_area_normalization BOOLEAN NOT NULL,
	default_area_unit area_unit_type NOT NULL,
	default_meter_reading_frequency INTERVAL NOT NULL
);
