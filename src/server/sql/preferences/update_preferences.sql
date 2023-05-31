/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

UPDATE preferences
SET
	display_title = ${displayTitle},
	default_chart_to_render = ${defaultChartToRender},
	default_bar_stacking = ${defaultBarStacking},
	default_language = ${defaultLanguage},
	default_timezone = ${defaultTimezone},
	default_warning_file_size = ${defaultWarningFileSize},
	default_file_size_limit = ${defaultFileSizeLimit},
	default_area_normalization = ${defaultAreaNormalization},
	default_area_unit = ${defaultAreaUnit},
	default_meter_reading_frequency = ${defaultMeterReadingFrequency}
;
