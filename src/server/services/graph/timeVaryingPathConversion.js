/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Conversion = require('../../models/Conversion');

/**
 * Chains time-varying conversions along a path, producing combined segments for cik_vary.
 * Each edge in the path may have multiple time segments (start_time, end_time, slope, intercept).
 * The algorithm aligns all segments and combines them for each time range.
 * @param {*} path Array of units (nodes) from source to destination.
 * @param {*} conn Database connection.
 * @param {*} getEdgeConversions Function to fetch all time-varying conversions for an edge.
 * @returns Array of {source, destination, startTime, endTime, slope, intercept}
 */
async function timeVaryingPathConversion(path, conn, getEdgeConversions) {
    //console.log('Computing time-varying path conversion for path:', path);
    // 1. Fetch and sort segments for each edge
    const edgeSegments = [];
    for (let i = 0; i < path.length - 1; ++i) {
        const sourceId = path[i].id;
        const destinationId = path[i + 1].id;
        let segments = await getEdgeConversions(sourceId, destinationId, conn);
        segments = segments.sort((a, b) => parsePostgresDate(a.startTime) - parsePostgresDate(b.startTime));
        edgeSegments.push(segments);
        //console.log(`Edge ${i}: source ${sourceId} -> dest ${destinationId}, segments:`, segments);
    }

    // 2. Initialize pointers for each edge
    const pointers = Array(path.length - 1).fill(0);

    // 3. Main loop
    let currentStart = Number.NEGATIVE_INFINITY;
    const results = [];
    let loopCount = 0;
    while (true) {
        loopCount++;
        //console.log(`\n--- Loop iteration ${loopCount} ---`);
        // Find current segments for each edge
        const currentSegments = edgeSegments.map((segments, idx) => segments[pointers[idx]]);
        //console.log('Current pointers:', pointers);
        //console.log('Current segments:', currentSegments);
        // Find minimum end time among current segments
        let currentEnd = Math.min(...currentSegments.map(seg => parsePostgresDate(seg.endTime)));
        //console.log('Current start:', currentStart, 'Current end:', currentEnd);

        // Combine conversions for the path
        let slope = 1, intercept = 0;
        for (const seg of currentSegments) {
            [slope, intercept] = updatedConversion(slope, intercept, seg.slope, seg.intercept);
        }
        //console.log('Combined slope:', slope, 'Combined intercept:', intercept);
        results.push({
            source: path[0].id,
            destination: path[path.length - 1].id,
            start_time: toPostgresTimestamp(currentStart),
            end_time: toPostgresTimestamp(currentEnd),
            slope,
            intercept
        });

        // Advance pointers for segments ending at currentEnd
        let done = false;
        for (let i = 0; i < pointers.length; ++i) {
            if (parsePostgresDate(currentSegments[i].endTime) === currentEnd) {
                pointers[i]++;
                //console.log(`Advancing pointer for edge ${i} to ${pointers[i]}`);
                if (pointers[i] >= edgeSegments[i].length) done = true;
            }
        }
        if (done || currentEnd === Number.POSITIVE_INFINITY) {
            //console.log('Exiting main loop. Done:', done, 'Current end is infinity:', currentEnd === Number.POSITIVE_INFINITY);
            break;
        }
        currentStart = currentEnd;
    }

    //console.log('Final results:', results);
    return results;
}

/**
 * Chains two conversions: (slope1, intercept1) and (slope2, intercept2)
 * Returns [slope, intercept] for the combined conversion.
 */
function updatedConversion(origSlope, origIntercept, newSlope, newIntercept) {
    const slope = origSlope * newSlope;
    const intercept = newSlope * origIntercept + newIntercept;
    return [slope, intercept];
}

function parsePostgresDate(val) {

    if (val === 'infinity') {
        return Number.POSITIVE_INFINITY;
    }
    if (val === '-infinity') {
        return Number.NEGATIVE_INFINITY;
    }
    if (typeof val === 'string') {
        return new Date(val).getTime();
    }
}
function toPostgresTimestamp(val) {
    if (val === Infinity) {
        return 'infinity';
    }
    if (val === -Infinity) {
        return '-infinity';
    }
    return new Date(val);
}

function invertConversion(slope, intercept) {
    return [1.0 / slope, -(intercept / slope)];
}


async function isBidirectional(sourceId, destinationId, conn) {
    const conversion = await Conversion.getBySourceDestination(sourceId, destinationId, conn);
    return conversion && conversion.bidirectional;
}

module.exports = { timeVaryingPathConversion };
