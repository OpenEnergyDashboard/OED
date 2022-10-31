/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { getConnection } = require('../db');
const Meter = require('../models/Meter');
const Preferences = require('../models/Preferences');
const moment = require('moment-timezone');

/**
 * This determines the timezone for a meter by choosing the first one that has
 * a value from: meter, site preferences, the server (must have one).
 * @param {*} meter The meter to get the timezone for
 * @returns desired timezone to use
 */
async function meterTimezone(meter) {
    // The timezone to use.
    let timezoneUse;
    if (meter.meterTimezone !== null) {
        // The meter has a timezone so that is used.
        timezoneUse = meter.meterTimezone;
    } else {
        // Get the default timezone for the OED site.
        // TODO maybe we should cache this somewhere so only do once.
        const conn = getConnection();
        const siteTimezone = (await Preferences.get(conn)).defaultTimezone;
        if (siteTimezone !== null) {
            // Use the site default timezone.
            timezoneUse = siteTimezone;
        } else {
            // Use server timezone. moment does its best to try to figure it out.
            // The documentation is unclear if it can return something that is
            // not a valid timezone but it seems to always give something.
            // Note if the server is UTC/GMT then it seems to return Africa/Abidjan
            // which has a zero offset to UTC so it is okay.
            // moment caches the result so it is only done once so faster.
            timezoneUse = moment.tz.guess();
        }
    }
    return timezoneUse;
}

module.exports = {
    meterTimezone
};
