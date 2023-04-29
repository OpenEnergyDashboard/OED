/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
  * Calculates the maximum number of raw and hourly points to be displayed.
  * @returns [maximumRawPoints, maximumHourlyPoints]
 */
function determineMaxPoints() {
    // For now, OED returns a fixed number of points. It is 1440 for both since
    // this is a good, general, max screen resolution. For max raw this means
    // that if a meter reads at 15 minute frequency it limits to
    // 15 days * 24 hours/day * 4 readings/hour  = 1440 readings/points.
    // For max hourly this means that with a point/reading each hour it limits to
    // 60 days * 24 points/day = 1440 points.

    // Sometime in the future OED might make this depend on the screen resolution
    // and/or admin input.

    return [1440, 1440];
}

module.exports = determineMaxPoints;
