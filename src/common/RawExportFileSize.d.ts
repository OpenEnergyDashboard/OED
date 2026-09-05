/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Estimates the size of a raw export in MB based on the number of readings.
 * Note that changing the language effects the size about +/- 8%.
 * This is just a decent estimate for larger files.
 * @param readingCount - The number of readings to estimate.
 * @returns The estimated size in MB.
 */
export function estimateRawExportSizeMB(readingCount: number): number;