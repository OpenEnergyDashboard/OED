/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');

/**
 * Calculates the minimum number of hour and daily points to be displayed.
 * This function is a work around since we do not know how to access environment
 * variables from the database level. It is also a temporary solution that will
 * be replaced when we later implement meter-by-meter logic for compressed readings.
 * @returns [minimumHourPoints, minimumDailyPoints]
 */
function determineMinPoints(){
	// Minimum daily points is set such that when the interval requested is under 60 days or 
	// about two months then the compressed_readings_2 algorithm should to the hourly view.
	const minimumDailyPoints = 61;

	// Minimum daily points is set such that when the raw reading rate is every 15 minutes and
	// then the compressed_readings_2 algorithm should to the raw data view when the interval
	// is under two weeks.
	// For other rates we have:
	// 1 minute -> interval under 24 hours or 1 day
	// 5 minute -> interval under 120 hours or 2 days
	const rawDataGranularity = moment.duration(process.env.OED_SITE_READING_RATE);
	const minimumHourPoints = 1440 * rawDataGranularity.asHours();

	return [minimumHourPoints, minimumDailyPoints].map(Math.floor);
};

module.exports = determineMinPoints;