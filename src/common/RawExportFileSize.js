/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const ESTIMATED_MB_PER_RAW_READING = 8.2e-5;

/**
 * Estimates the size of a raw export in MB based on the number of readings.
 * Note that changing the language effects the size about +/- 8%.
 * This is just a decent estimate for larger files.
 * @param readingCount - The number of readings to estimate.
 * @returns The estimated size in MB.
 */
function estimateRawExportSizeMB(readingCount) {
	return readingCount * ESTIMATED_MB_PER_RAW_READING;
}

module.exports = {
	estimateRawExportSizeMB
};