/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Conversion = require('../../models/Conversion');
const ConversionSegment = require('../../models/ConversionSegment');
const Unit = require('../../models/Unit');

/**
 * Returns the slope & intercept for the conversion from sourceUnit 
 * to destinationUnit and suffix of the destination unit for it.
 * @param {*} sourceUnit The source unit's id. 
 * @param {*} destinationUnit The destination unit's id.
 * @param {*} conn The connection to use.
 * @returns 
 */
async function conversionValues(sourceUnit, destinationUnit, conn) {
	// Tells if had to use the reverse conversion to find the desired conversion.
	let reversed = false;
	// TODO This should return the name not the id of the units involved.
	let desiredConversion = await Conversion.getBySourceDestination(sourceUnit, destinationUnit, conn);
	let slope;
	let intercept;
	let suffix;
	if (desiredConversion === null) {
		// Did not find the conversion. Since conversion should exist, it must be the other way around and bidirectional.
		desiredConversion = await Conversion.getBySourceDestination(destinationUnit, sourceUnit, conn);
		if (desiredConversion === null || desiredConversion.bidirectional === false) {
			// This should never happen. It should have been in the table one way or the other.
			throw Error(`The conversions from ${sourceUnit} to ${destinationUnit} doesn't exist`);
		}
		reversed = true;
	}
	// TODO For now this is limited to conversions that do not vary with time. This might be temporary but have to
	// be decided if there is a reason to do that. To do this seems to involve creating a path of conversions, determining
	// overall conversion with segments based on the conversion segments & then inserting them into the DB.

	// Need to get the slope/intercept from the conversion segments. For now, it only works if there is a single one.
	const segments = await ConversionSegment.getBySourceDestination(desiredConversion.sourceId, desiredConversion.destinationId, conn);
	if (segments.length === 1) {
		const segmentSlope = segments[0].slope;
		const segmentIntercept = segments[0].intercept;
		if (reversed) {
			// We need to invert the conversion since it needs to go the other way from how stored.
			({ convertedSlope: slope, convertedIntercept: intercept } = invertConversion(segmentSlope, segmentIntercept));
			// Since we inverted the conversion, we use the suffix from the destination.
			suffix = (await Unit.getById(destinationUnit, conn)).suffix;
		} else {
			// We found it in the desired order.
			slope = segmentSlope;
			intercept = segmentIntercept;
			suffix = (await Unit.getById(sourceUnit, conn)).suffix;
		}
	} else {
		// This is not allowed since can currently only do for non-time-varying conversions.
		// It also may absorb the case of no segments but that should never happen.
		// TODO fix up to include the source/destination as above.
		throw new Error('The current version of OED only accepts conversion along that are not time-varying if it involves a suffix unit');
	}
	return [slope, intercept, suffix];
}

/**
 * Returns the inverted conversion of one provided as a slope and intercept.
 * @param {*} slope The conversion's slope.
 * @param {*} intercept The conversion's intercept.
 * @returns {object} the inverted conversion as { convertedSlope, convertedIntercept }.
 */
function invertConversion(slope, intercept) {
	// What is stored for this entry in the units table:
	// destination_value = slope * source_value + intercept
	// Invert this equation to give:
	// source_value = (1/slope) * destination_value - (intercept / slope)
	// If slope is zero then return that, otherwise invert.
	const convertedSlope = slope === 0 ? 0 : 1.0 / slope;
	// If intercept is zero then return that (otherwise get -0), otherwise invert.
	const convertedIntercept = intercept === 0 ? 0 : -(intercept / slope);
	return { convertedSlope, convertedIntercept };
}

/**
 * Returns the updated overall conversion given a new conversion to add at the end.
 * @param {*} origSlope The current conversion's slope.
 * @param {*} origIntercept The current conversion's intercept.
 * @param {*} newSlope The conversion's slope to add.
 * @param {*} newIntercept The conversion's intercept to add.
 * @returns 
 */
function updatedConversion(origSlope, origIntercept, newSlope, newIntercept) {
	// The current conversion is:
	// conv(unit, origSlope, origIntercept) = origSlope * unit + origIntercept
	// We need to update unit for the new conversion so compose with that:
	// conv(conv(unit, origSlope, origIntercept), newSlope, newIntercept))
	// = conv(origSlope * unit + origIntercept, newSlope, newIntercept) 
	// = newSlope * (origSlope * unit + origIntercept) + newIntercept
	// = (newSlope * origSlope) * unit + (newSlope *  origIntercept + newIntercept)
	const slope = origSlope * newSlope;
	const intercept = newSlope * origIntercept + newIntercept;
	return [slope, intercept];
}

/**
 * Returns the conversion information (slope, intercept, and suffix) of a path.
 * @param {*} path The array of units on the path from source to destination.
 * @param {*} conn The connection to use.
 * @returns 
 */
async function pathConversion(path, conn) {
	// Initial values so the starting conversion is the identity. Thus, when the first edge on the path
	// is processed we get its conversion.
	let slope = 1;
	let intercept = 0;
	let suffix = '';
	for (let i = 0; i < path.length - 1; ++i) {
		const sourceId = path[i].id;
		const destinationId = path[i + 1].id;
		const [newSlope, newIntercept, newSuffix] = await conversionValues(sourceId, destinationId, conn);
		// Updates the path conversion for this new edge.
		[slope, intercept] = updatedConversion(slope, intercept, newSlope, newIntercept);
		// Updates the suffix for this new edge.
		if (newSuffix !== '') {
			// The destination does not have an empty suffix so record it.
			suffix = newSuffix;
		}
	}
	return [slope, intercept, suffix];
}

module.exports = { invertConversion, updatedConversion, pathConversion };