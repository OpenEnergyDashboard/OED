/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    // Fetch all time-varying conversions for each edge in the path
    const edgeSegments = [];
    for (let i = 0; i < path.length - 1; ++i) {
        const sourceId = path[i].id;
        const destinationId = path[i + 1].id;
        // getEdgeConversions should return sorted array of {start_time, end_time, slope, intercept}
        const segments = await getEdgeConversions(sourceId, destinationId, conn);
        edgeSegments.push(segments);
    }

    // Collect all unique time boundaries
    const boundaries = new Set();
    edgeSegments.forEach(segments => {
        segments.forEach(seg => {
            boundaries.add(parsePostgresDate(seg.startTime));
            boundaries.add(parsePostgresDate(seg.endTime));
        });
    });
    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

    // Build combined segments
    const results = [];
    for (let i = 0; i < sortedBoundaries.length - 1; ++i) {
        const startTime = sortedBoundaries[i];
        const endTime = sortedBoundaries[i + 1];
        let valid = true;
        let slope = 1;
        let intercept = 0;

        // For each edge, find the segment covering this time range
        for (const [edgeIndex, segments] of edgeSegments.entries()) {
            // Try to find segment in forward direction
            let seg = segments.find(s =>
                parsePostgresDate(s.startTime) <= startTime &&
                parsePostgresDate(s.endTime) >= endTime &&
                s.sourceId === path[edgeIndex].id &&
                s.destinationId === path[edgeIndex + 1].id
            );

            let invert = false;

            if (!seg) {
                // Try to find segment in reverse direction
                seg = segments.find(s =>
                    parsePostgresDate(s.startTime) <= startTime &&
                    parsePostgresDate(s.endTime) >= endTime &&
                    s.sourceId === path[edgeIndex + 1].id &&
                    s.destinationId === path[edgeIndex].id &&
                    s.bidirectional
                );
                if (seg) invert = true;
            }

            if (!seg) {
                valid = false;
                break;
            }

            let segSlope = seg.slope;
            let segIntercept = seg.intercept;
            if (invert) {
                [segSlope, segIntercept] = invertConversion(segSlope, segIntercept);
            }

            [slope, intercept] = updatedConversion(slope, intercept, segSlope, segIntercept);
        }
        if (valid) {
            results.push({
                source: path[0].id,
                destination: path[path.length - 1].id,
                start_time: toPostgresTimestamp(startTime),
                end_time: toPostgresTimestamp(endTime),
                slope,
                intercept
            });
        }
    }

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

module.exports = { timeVaryingPathConversion };
