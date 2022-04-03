/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const moment = require('moment');
const { log } = require('../../log');

/**
 * Calculates the minimum number of hour and daily points to be displayed.
 * This function is a work around since we do not know how to access environment
 * variables from the database level. It is also a temporary solution that will
 * be replaced when we later implement meter-by-meter logic for averaged readings.
 * @returns [minimumHourPoints, minimumDailyPoints]
 */
function determineMinPoints(){
	// Minimum daily points is set such that when the interval requested is under 60 days or 
	// about two months then the line_meters_readings_unit algorithm should go to the hourly view.
	const minimumDailyPoints = 61;

	// Minimum daily points is set such that when the raw reading rate is every 15 minutes and
	// then the line_meters_readings_unit algorithm should go to the raw data view when the interval
	// is under 15 days (or a little over two weeks).
	// For other rates we have:
	// 1 minute -> interval under 24 hours or 1 day
	// 5 minute -> interval under 120 hours or 2 days
	const siteReadingRate = process.env.OED_SITE_READING_RATE;
	const rawDataGranularity = moment.duration(siteReadingRate);

	const regex = /^(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)$/
	// regex checks if string is in the ranges:
	// 00:00:00 - 00:00:59
	// 00:01:00 - 00:59:59
	// 01:00:00 - \d+:59:59
	if(!regex.test(siteReadingRate)){
		log.warn('Invalid Site Level Reading Rate format');
	}

	const minimumHourPoints = 1440 * rawDataGranularity.asHours();

	return [minimumHourPoints, minimumDailyPoints].map(Math.floor);
};

module.exports = determineMinPoints;