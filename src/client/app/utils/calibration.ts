/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MapMetadata } from '../types/redux/map';
import { logToServer } from '../actions/logs';

/**
 * Defines a Cartesian Point with x & y
 */
export interface CartesianPoint {
	x: number;
	y: number;
}

/**
 * If copied from places such as google map, the format is latitude, longitude;
 * stored as (longitude, latitude) in Postgres as POINTS. The GPS stores
 * longitude & latitude.longitude is the 'x' axis of GIS coordinate system,
 * min: -180, max: 180. latitude is the 'y' axis of GIS coordinate system,
 * min: -90, max: 90;
 */
export interface GPSPoint {
	longitude: number;
	latitude: number;
}

/**
 * Stores the GPS (degree) change per true north grid unit as
 * degreePerUnitX and degreePerUnitY.
 */
export interface MapScale {
	degreePerUnitX: number;
	degreePerUnitY: number;
}

/**
 * Stores a combination of the CartesianPoint and GPS point in a
 * single object.
 */
export interface CalibratedPoint {
	cartesian: CartesianPoint;
	gps: GPSPoint;
}

/**
 * Stores the x & y error from calibration along with the GPS coordinates
 * of the origin and opposite. The latter two are stored in the DB.
 */
export interface CalibrationResult {
	maxError: {
		x: number,
		y: number
	};
	origin: GPSPoint;
	opposite: GPSPoint;
}

/**
 * Holds the width & height which normally represent the dimensions of an image.
 */
export interface Dimensions {
	width: number;
	height: number;
}

/**
 * Returns true if meter and map and reasonably defined and false otherwise.
 * @param meterInfo meter info to check
 * @param map map info to check
 * @returns True if map is defined with origin & opposite and meter with valid GPS
 */
export function meterMapInfoOk(meterInfo: { gps?: GPSPoint, meterID: number }, map: MapMetadata): boolean {
	if (map === undefined) { return false; }
	if ((meterInfo.gps === null || meterInfo.gps === undefined) || map.origin === undefined || map.opposite === undefined) { return false; }
	if (!isValidGPSInput(`${meterInfo.gps.latitude},${meterInfo.gps.longitude}`)) {
		logToServer('error', `Found invalid meter gps stored in database, id = ${meterInfo.meterID}`);
		return false;
	}
	return true;
}

/**
 * Returns true if point lies within the map to display on.
 * @param size The map size that is being used.
 * @param point The point being considered for display in user map grid coordinates.
 * @returns true if within map and false otherwise.
 */
export function meterDisplayableOnMap(size: Dimensions, point: CartesianPoint): boolean {
	// The user map is a rectangle that is parallel to the Plotly grid. Thus, the point
	// must be above origin (bottom, left) and below the opposite (top, right) corner.
	// The Plotly grid was set up so
	// the origin is (0, 0) and the opposite corner is the dimension of the map.
	return point.x >= 0 && point.x <= size.width && point.y >= 0 && point.y <= size.height;
}

/**
 * Checks if the string is a valid GPS representation. This requires it to be two numbers
 * separated by a comma and the GPS values to be within allowed values.
 * Note it causes a popup if the GPS values are not valid.
 * @param input The string to check for GPS values
 * @returns true if string is GPS and false otherwise.
 */
export function isValidGPSInput(input: string): boolean {
	if (input.indexOf(',') === -1) { // if there is no comma
		return false;
	} else if (input.indexOf(',') !== input.lastIndexOf(',')) { // if there are multiple commas
		return false;
	}
	// Works if value is not a number since parseFloat returns a NaN so treated as invalid later.
	const array = input.split(',').map((value: string) => parseFloat(value));
	const latitudeIndex = 0;
	const longitudeIndex = 1;
	const latitudeConstraint = array[latitudeIndex] >= -90 && array[latitudeIndex] <= 90;
	const longitudeConstraint = array[longitudeIndex] >= -180 && array[longitudeIndex] <= 180;
	const result = latitudeConstraint && longitudeConstraint;
	if (!result) {
		window.alert('invalid gps coordinate, ' +
			'\nlatitude should be an integer between -90 and 90, ' +
			'\nlongitude should be an integer between -180 and 180');
	}
	return result;
}

/**
 * Calculates the GPS unit per coordinate unit.
 * @param origin The GPS value for the origin that was computed during calibration.
 * 	This is the bottom, left corner of the user map.
 * @param opposite The GPS value for the opposite that was computed during calibration.
 * 	This is the top, right corner of the user map.
 * @param imageDimensions This is the size of the normalized map image.
 * @returns a pair {deltaX, deltaY} representing the GPS degree per unit (x, y)
 * 	on true north map grid.
 */
export function calculateScaleFromEndpoints(origin: GPSPoint, opposite: GPSPoint, size: Dimensions): MapScale {
	// GPS values do not need to shift or rotate. The origin/opposite needs to be on the true north map.
	// See calibrate function for the cartesian values used.
	const originComplete: CalibratedPoint = { gps: origin, cartesian: trueNorthOrigin(size) };
	const oppositeComplete: CalibratedPoint = { gps: opposite, cartesian: trueNorthOpposite(size) };
	const scaleOfMap: MapScale = calculateScale(originComplete, oppositeComplete);
	return scaleOfMap;
}

/**
 * Convert the gps value to the equivalent Plotly grid coordinates on user map.
 * @param size The normalized size of the map
 * @param gps The GPS coordinate to convert
 * @param originGPS The GPS value of the origin on the true north map.
 * @param scaleOfMap The GPS degree per unit x, y on the true north map.
 * @returns x, y value of the gps point on the user map.
 */
export function gpsToUserGrid(size: Dimensions, gps: GPSPoint, originGPS: GPSPoint, scaleOfMap: MapScale): CartesianPoint {
	// We need the origin x, y value by starting from 0, 0 on the user map and
	// shift/rotate into true north.
	const originTrueNorth = trueNorthOrigin(size);
	// Now, convert from GPS to true north grid (x, y).
	// Calculate how far the point is from origin and then the units for this distance.
	const gridTrueNorth: CartesianPoint = {
		x: originTrueNorth.x + (gps.longitude - originGPS.longitude) / scaleOfMap.degreePerUnitX,
		y: originTrueNorth.y + (gps.latitude - originGPS.latitude) / scaleOfMap.degreePerUnitY
	};
	// Now rotate to user map and shift so origin at bottom, left. Do - angle since going from
	// true north to user map.
	const userGrid: CartesianPoint = rotateShift(size, gridTrueNorth, 1, -trueNorthAngle.angle);
	return userGrid;
}

/**
 * Calculates the normalized scale of a map and stores in the database as the
 * origin and opposite points. It also calculates the relative error for this
 * scale by finding the maximum difference between the calculated scale and the
 * one from each pair of calibration points. It returns all three of these values.
 * @param calibrationSet All the points clicked by the user for calibration.
 * @param imageDimensions The dimensions of the original map to use from the user.
 * @returns The error and the origin & opposite point in GPS to use for mapping.
 */
export function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions): CalibrationResult {
	// Normalize dimensions to grid used in Plotly
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// Array to hold the map scale for each pair of points.
	const scales: MapScale[] = [];
	// Calculate (n choose 2) scales for each pair of data points.
	for (let i = 0; i < calibrationSet.length - 1; i++) {
		for (let j = i + 1; j < calibrationSet.length; j++) {
			// Normalize dimensions to grid used in Plotly
			// The calibration coordinates are on the user map. Shift and rotate
			// point to place on true north map (logical). The true north map
			// leaves the origin at the center so no reverse shift. As always,
			// need to shift before rotate so axis origin is in middle of map.
			const p1TrueNorth: CartesianPoint = shiftRotate(normalizedDimensions, calibrationSet[i].cartesian, -1, trueNorthAngle.angle);
			const p2TrueNorth: CartesianPoint = shiftRotate(normalizedDimensions, calibrationSet[j].cartesian, -1, trueNorthAngle.angle);
			// Put the true north coordinates and gps together as needed for the function. Note the GPS
			// value is the same on either map so it does not change.
			const first: CalibratedPoint = { cartesian: p1TrueNorth, gps: calibrationSet[i].gps };
			const second: CalibratedPoint = { cartesian: p2TrueNorth, gps: calibrationSet[j].gps };
			// Calculate the change in GPS degrees for x or y distance on the true
			// north map. Only in true north are the GPS coordinates parallel to
			// the axis so this can be done.
			const mapScale: MapScale = calculateScale(first, second);
			// Record the scale for this pair of points.
			scales.push(mapScale);
		}
	}
	// Take average of all the pairs to get the calibrated scale.
	let XScaleSum = 0;
	let YScaleSum = 0;
	const numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i].degreePerUnitX;
		YScaleSum += scales[i].degreePerUnitY;
	}
	const degreePerUnitX = XScaleSum / numDataPoints;
	const degreePerUnitY = YScaleSum / numDataPoints;

	// Calculate gps coordinates for the origin.
	// The origin is the lower, left corner of the user map. However, you have
	// to calculate on the true north map.
	// First calculate the clicked point that are using to find the origin GPS
	// value. Use the first point clicked and shift/rotate into true north.
	// As usual, first we shift since the rotation must be about the center.
	// The coordinate starts at (0, 0) for the lower, left corner of the user map.
	// TODO Is it okay to use the one point or would an average be better?
	const clickedTrueNorth: CartesianPoint = shiftRotate(normalizedDimensions, calibrationSet[0].cartesian, -1, trueNorthAngle.angle);
	// Now do the same with the origin. This is at (0, 0) on the user map.
	const originTrueNorth = trueNorthOrigin(normalizedDimensions);
	// Calculate the GPS value at the origin. This is done by taking the GPS of the point clicked
	// and finding how far it is from the origin in grid units and then
	// calculating that distance in GPS units.
	// This works because GPS values do not change on the user and true north maps so
	// the value on the true north map is same as user map.
	// It is important to note that the origin/opposite make a rectangle that is
	// equivalent to the one on the user map and is not parallel to the true north map
	// (assuming the map rotation angle is not zero).
	const originCoordinate: GPSPoint = {
		latitude: calibrationSet[0].gps.latitude + degreePerUnitY * (originTrueNorth.y - clickedTrueNorth.y),
		longitude: calibrationSet[0].gps.longitude + degreePerUnitX * (originTrueNorth.x - clickedTrueNorth.x)
	};

	// Calculate gps coordinates for the opposite point which is the top, right corner of the user map.
	// The Plotly coordinates have the opposite at the max coordinate values that is the normalized
	// size coordinates.
	// Similar to above but different point.
	const opposite: CartesianPoint = { x: normalizedDimensions.width, y: normalizedDimensions.height }
	const oppositeTrueNorth: CartesianPoint = shiftRotate(normalizedDimensions, opposite, -1, trueNorthAngle.angle);
	const oppositeCoordinate: GPSPoint = {
		latitude: calibrationSet[0].gps.latitude + degreePerUnitY * (oppositeTrueNorth.y - clickedTrueNorth.y),
		longitude: calibrationSet[0].gps.longitude + degreePerUnitX * (oppositeTrueNorth.x - clickedTrueNorth.x)
	};

	// Calculate max relative error by looking at each calibration point to see how compares
	// to the average value calculated.
	const scalesWithMaxDifference: MapScale = {
		degreePerUnitX: 0,
		degreePerUnitY: 0
	};
	// Loop over all pairs of calibration points.
	for (let i = 0; i < calibrationSet.length; i++) {
		// Find the absolute difference between the scale from this pair of clicked
		// points and the average one. Then normalize by the assumed correct value
		// which is the average value. This gives the relative error.
		const XScaleDifference = Math.abs((scales[i].degreePerUnitX - degreePerUnitX) / degreePerUnitX);
		const YScaleDifference = Math.abs((scales[i].degreePerUnitY - degreePerUnitY) / degreePerUnitY);
		// Record the max value found for both x and y.
		if (XScaleDifference > scalesWithMaxDifference.degreePerUnitX) {
			scalesWithMaxDifference.degreePerUnitX = XScaleDifference;
		}
		if (YScaleDifference > scalesWithMaxDifference.degreePerUnitY) {
			scalesWithMaxDifference.degreePerUnitY = YScaleDifference;
		}
	}
	// Convert to a percentage and only give 3 decimal places since error not that accurate.
	const maxErrorPercentage = {
		x: Number.parseFloat((scalesWithMaxDifference.degreePerUnitX * 100).toFixed(3)),
		y: Number.parseFloat((scalesWithMaxDifference.degreePerUnitY * 100).toFixed(3))
	};
	// Wrap up the error and origin/opposite points to return.
	const result: CalibrationResult = {
		maxError: maxErrorPercentage,
		origin: originCoordinate,
		opposite: oppositeCoordinate
	};
	return result;
}

/**
 * Return the change in GPS degree per unit on map grid.
 * @param p1 First point to use in calculation.
 * @param p2 Second point to use in calculation.
 * @returns a pair {deltaX, deltaY} representing the GPS degree per unit (x, y) on map grid.
 */
function calculateScale(p1: CalibratedPoint, p2: CalibratedPoint) {
	// Calculate the change in GPS longitude and x point and then use to get the GPS degree
	// change per x unit. Note that GPS latitude, longitude corresponds to (y, x) so the
	// grid coordinates are reversed for this reason.
	const deltaLongitude = p1.gps.longitude - p2.gps.longitude;
	const deltaXInUnits = p1.cartesian.x - p2.cartesian.x;
	const degreePerUnitX = deltaLongitude / deltaXInUnits;

	// Similar to above but for the latitude.
	const deltaLatitude = p1.gps.latitude - p2.gps.latitude;
	const deltaYInUnits = p1.cartesian.y - p2.cartesian.y;
	const degreePerUnitY = deltaLatitude / deltaYInUnits;

	return { degreePerUnitX, degreePerUnitY };
}

/**
 * Normalize image dimensions to fit within the default 500*500 pixel-sized graph.
 * @param dimensions The size (width, height) of the map loaded into OED
 * @return Normalized size of map so no more than 500 on either side.
 */
export function normalizeImageDimensions(dimensions: Dimensions): Dimensions {
	let res: Dimensions;
	let width;
	let height;
	// Use the larger dimension to be 500 and this makes sure the other dimension
	// that is normalized will be less than 500.
	if (dimensions.width > dimensions.height) {
		width = 500;
		height = 500 * dimensions.height / dimensions.width;
	} else {
		height = 500;
		width = 500 * dimensions.width / dimensions.height;
	}
	res = {
		width,
		height
	};
	return res;
}

/**
 * Shifts point by 1/2 size dimensions.
 * @param size The size of the image (normally normalized map size)
 * @param point The (x,y) pair for the point to be shifted
 * @param direction The factor to scale the shift by. Normally either +1 to add the shift or -1 to subtract.
 * @returns (x,y) pair shifted by 1/2 the width and height of map image
 */
export function shift(size: Dimensions, point: CartesianPoint, direction: number): CartesianPoint {
	// 1/2 the image sizes that will be used in shift.
	const xShift = size.width / 2;
	const yShift = size.height / 2;
	// Shifted x,y values
	const xValue = point.x + direction * xShift;
	const yValue = point.y + direction * yShift;
	// Shifted point to return.
	const p: CartesianPoint = { x: xValue, y: yValue };
	return p;
}

/**
 * Rotates point counterclockwise through angle.
 * @param angleDeg Angle in degrees to rotate by. Note that positive means counterclockwise.
 * @param point (x,y) pair to rotate.
 * @returns Rotated (x,y) pair.
 */
export function rotate(angleDeg: number, point: CartesianPoint): CartesianPoint {
	// Convert angle to radians.
	const angleRad = angleDeg / 180.0 * Math.PI;
	// Rotate point counterclockwise. This is really a 2x2 matrix times the point vector.
	const xRotated = point.x * Math.cos(angleRad) - point.y * Math.sin(angleRad);
	const yRotated = point.x * Math.sin(angleRad) + point.y * Math.cos(angleRad);
	// Rotated point to return.
	const p: CartesianPoint = { x: xRotated, y: yRotated };
	return p;
}

/**
 * This shifts the point and then rotates by the angle. Typically used to go from user map to true north.
 * @param size The size of the image (normally normalized map size)
 * @param point The (x,y) pair for the point to be shifted & rotated
 * @param direction The factor to scale the shift by. Normally either +1 to add the shift or -1 to subtract.
 * @param angleDeg Angle in degrees to rotate by. Note that positive means counterclockwise.
 * @returns (x,y) pair shifted by 1/2 the width and height of map image and rotated by angleDeg
 */
export function shiftRotate(size: Dimensions, point: CartesianPoint, direction: number, angleDeg: number): CartesianPoint {
	// Note you typically shift because the rotation must occur around the center of the map but the plotly coordinates
	// have the origin at the bottom, left corner.
	const shifted: CartesianPoint = shift(size, point, direction);
	// Now rotate the centered image by the angle given.
	const rotated: CartesianPoint = rotate(angleDeg, shifted);
	return rotated;
}

/**
 * This rotates the point by the angle and then shifts. Typically used to go from true north to user map.
 * @param size The size of the image (normally normalized map size)
 * @param point The (x,y) pair for the point to be rotated & shifted
 * @param direction The factor to scale the shift by. Normally either +1 to add the shift or -1 to subtract.
 * @param angleDeg Angle in degrees to rotate by. Note that positive means counterclockwise.
 * @returns (x,y) pair shifted by 1/2 the width and height of map image
 */
export function rotateShift(size: Dimensions, point: CartesianPoint, direction: number, angleDeg: number): CartesianPoint {
	// Now rotate the centered image by the angle given.
	const rotated: CartesianPoint = rotate(angleDeg, point);
	// Note you typically shift because the rotation must occur around the center of the map but the plotly coordinates
	// have the origin at the bottom, left corner. This shift is normally the opposite of the shiftRotate one since
	// going the other way.
	const shifted: CartesianPoint = shift(size, rotated, direction);
	return shifted;
}

/**
 * Returns the origin of the user map converted to the true north map. Note that it is in
 * in the bottom, left on the user map but in the center on the true north map.
 * @param size the normalized map dimensions
 * @returns The origin coordinates on the true north map
 */
export function trueNorthOrigin(size: Dimensions): CartesianPoint {
	// Origin coordinate on user map is (0, 0).
	const origin: CartesianPoint = { x: 0, y: 0 };
	// Shift this value to center and then rotate to put on true north map.
	return shiftRotate(size, origin, -1, trueNorthAngle.angle);
}

/**
 * Similar to trueNorthOrigin function but returns the opposite corner of the user map converted
 * to the true north map. Note that it is in the top, right of the user map but
 * relative to the center on the true north map.
 * @param size the normalized map dimensions
 * @returns The opposite coordinates on the true north map
 */
export function trueNorthOpposite(size: Dimensions): CartesianPoint {
	// The opposite coordinate is the size since it is in the top, right corner
	// of the user map.
	const opposite: CartesianPoint = { x: size.width, y: size.height }
	// Shift this value to center and then rotate to put on true north map.
	return shiftRotate(size, opposite, -1, trueNorthAngle.angle);
}


// TODO The angle is hard coded but needs to come from the admin/DB.
// This hack lets the angle be set to use elsewhere. For now leave so
// no rotation.
export const trueNorthAngle = { angle: 0.0 };
