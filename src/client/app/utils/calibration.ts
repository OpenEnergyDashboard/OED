/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MapMetadata } from '../types/redux/map';
import { logToServer } from '../actions/logs';

export interface CartesianPoint {
	x: number;
	y: number;
}

/**
 * if copied from places such as google map, the format is latitude, longitude;
 * stored as (longitude, latitude) in postgres as POINTS
 * @param longitude: the 'x' axis of GIS coordinate system, min: -180, max: 180;
 * @param latitude: the 'y' axis of GIS coordinate system, min: -90, max: 90;
 */
export interface GPSPoint {
	longitude: number;
	latitude: number;
}

/**
 * @param degreePerUnitX
 * @param degreePerUnitY
 */
interface MapScale {
	degreePerUnitX: number;
	degreePerUnitY: number;
}

export interface CalibratedPoint {
	cartesian: CartesianPoint;
	gps: GPSPoint;
}

export interface CalibrationResult {
	maxError: {
		x: number,
		y: number
	};
	origin: GPSPoint;
	opposite: GPSPoint;
}

export interface Dimensions {
	width: number;
	height: number;
}

export function meterDisplayableOnMap(meterInfo: { gps?: GPSPoint, meterID: number }, map: MapMetadata): boolean {
	if (map === undefined) { return false; }
	if ((meterInfo.gps === null || meterInfo.gps === undefined) || map.origin === undefined || map.opposite === undefined) { return false; }
	if (!isValidGPSInput(`${meterInfo.gps.latitude},${meterInfo.gps.longitude}`)) {
		logToServer('error', `Found invalid meter gps stored in database, id = ${meterInfo.meterID}`);
	}

	// TODO The angle is hard coded but needs to come from the admin/DB.
	const angle = 30.0;
	// return longitudeValidation && latitudeValidation;
	// We need to map the GPS coordinates onto the user map. Logically the GPS values reside on the true north map.
	// However, only the user map has the rectangle that outlines the map as parallel the the grid axis. Having this
	// makes it easy to tell if a point is inside or not. Thus, the GPS value is rotated onto the user map
	// and then the check is done.
	// Rotate by - angle (since going from true north to user map) where must reverse latitude, longitude so x, y.
	const gpsRotated: CartesianPoint = rotate(-angle, { x: meterInfo.gps.longitude, y: meterInfo.gps.latitude });
	// Must be above origin and below opposite to reside inside of rectangle that is the map. Again, switch for usual
	// for x, y and latitude, longitude.
	return (gpsRotated.y >= map.origin.latitude && gpsRotated.y <= map.opposite.latitude &&
		gpsRotated.x >= map.origin.longitude && gpsRotated.x <= map.opposite.longitude);
}

export function isValidGPSInput(input: string) {
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
 * Calculates the GPS unit/coordinate unit.
 * @param origin The GPS value for the origin that was computed during calibration. This is the center of the true north map.
 * @param opposite The GPS value for the opposite that was computed during calibration. This is the top, left corner of the true north map.
 * @param imageDimensions This is of the map image (not normalized)
 * @returns a pair {deltaX, deltaY} representing the GPS degree per unit (x, y) on map grid.
 */
export function calculateScaleFromEndpoints(origin: GPSPoint, opposite: GPSPoint, imageDimensions: Dimensions) {
	// Normalize dimensions to grid used in Plotly
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// Since this involves GPS values we do not need to shift or rotate.
	// See calibrate function for the cartesian values used.
	const originComplete: CalibratedPoint = { gps: origin, cartesian: { x: 0, y: 0 } };
	const oppositeComplete: CalibratedPoint = { gps: opposite, cartesian: { x: normalizedDimensions.width, y: normalizedDimensions.height } };
	const mapScale: MapScale = calculateScale(originComplete, oppositeComplete);
	return mapScale;
}

export function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions) {
	// TODO The angle is hard coded but needs to come from the admin/DB.
	const angle = 30.0;
	// Normalize dimensions to grid used in Plotly
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// calculate (n choose 2) scales for each pair of data points;
	const scales: MapScale[] = [];
	for (let i = 0; i < calibrationSet.length - 1; i++) {
		for (let j = i + 1; j < calibrationSet.length; j++) {
			// Normalize dimensions to grid used in Plotly
			const res = normalizeImageDimensions(imageDimensions);
			// Shift the point clicked on the user image so the origin is in the center of the map.
			// This is done since the rotation must be about the center.
			const p1Shifted: CartesianPoint = shift(res, calibrationSet[i].cartesian, -1);
			const p2Shifted: CartesianPoint = shift(res, calibrationSet[j].cartesian, -1);
			// Rotate counterclockwise by the angle.
			const p1Rotated: CartesianPoint = rotate(angle, p1Shifted);
			const p2Rotated: CartesianPoint = rotate(angle, p2Shifted);
			const first: CalibratedPoint = {cartesian: p1Rotated, gps: calibrationSet[i].gps};
			const second: CalibratedPoint = {cartesian: p2Rotated, gps: calibrationSet[j].gps};
			const mapScale: MapScale = calculateScale(first, second);
			scales.push(mapScale);
		}
	}
	// take average to get the calibrated scale;
	let XScaleSum = 0;
	let YScaleSum = 0;
	const numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i].degreePerUnitX;
		YScaleSum += scales[i].degreePerUnitY;
	}
	const degreePerUnitX = XScaleSum / numDataPoints;
	const degreePerUnitY = YScaleSum / numDataPoints;

	// TODO Is it okay to use the one point or would an average be better?

	// Calculate gps coordinates for the origin.
	// The origin is the lower, left corner of the input map. However, you have
	// to calculate on the true north map. Start with the coordinates on the user
	// map.
	// Shift to put origin at center of user map.
	// This is done since the rotation must be about the center.
	const pShifted: CartesianPoint = shift(normalizedDimensions, calibrationSet[0].cartesian, -1);
	// Rotate about center so now on true north.
	const pRotated: CartesianPoint = rotate(angle, pShifted);
	// Shift other way so on true north so origin at bottom, left.
	const pRotatedShifted = shift(normalizedDimensions, pRotated, 1);
	// Calculate the GPS value at the origin. This is done by taking the GPS of the point
	// and finding how far it is from the origin in grid units in lower, left at (0, 0) and then
	// calculating that distance in GPS units. There is no subtraction from the x or y since
	// The other point is the origin so would subtract zero.
	// This works because GPS values do not change on the user and true north maps so
	// the value on the true north map is same as user map. It is important to note that the origin/opposite
	// make a rectangle that is aligned with the user map and is not parallel to the true north map.
	// Thus, GPS values on the true north map can be outside this rectangle but will be inside the
	// rectangle on the user map. Note that the actual true north map has all the points if you use the
	// rotated rectangle from shifting from the user map to true north.
	const originCoordinate: GPSPoint = {
		latitude: calibrationSet[0].gps.latitude - degreePerUnitY * pRotatedShifted.y,
		longitude: calibrationSet[0].gps.longitude - degreePerUnitX * pRotatedShifted.x
	};

	// Calculate gps coordinates for the top, right corner of the true north map.
	// Similar to above but start from origin and use size of image
	// to figure out how far away the opposite is. Opposite is the top, right corner on
	// the user map.
	const oppositeCoordinate: GPSPoint = {
		latitude: originCoordinate.latitude + normalizedDimensions.height * degreePerUnitY,
		longitude: originCoordinate.longitude + normalizedDimensions.width * degreePerUnitX
	};

	// calculate max error
	const diagonal = Math.sqrt(Math.pow(normalizedDimensions.width * degreePerUnitX, 2) + Math.pow(normalizedDimensions.height * degreePerUnitY, 2));
	const scalesWithMaxDifference: MapScale = {
		degreePerUnitX: 0,
		degreePerUnitY: 0
	};
	const pointIndexWithMaxDifference = {
		x: -1,
		y: -1
	};
	for (let i = 0; i < calibrationSet.length; i++) {
		const XScaleDifference = Math.abs(scales[i].degreePerUnitX - degreePerUnitX);
		const YScaleDifference = Math.abs(scales[i].degreePerUnitY - degreePerUnitY);
		if (XScaleDifference > scalesWithMaxDifference.degreePerUnitX) {
			pointIndexWithMaxDifference.x = i;
			scalesWithMaxDifference.degreePerUnitX = XScaleDifference;
		}
		if (YScaleDifference > scalesWithMaxDifference.degreePerUnitY) {
			pointIndexWithMaxDifference.y = i;
			scalesWithMaxDifference.degreePerUnitY = YScaleDifference;
		}
	}
	const maxErrorPercentage = {
		x: Number.parseFloat((scalesWithMaxDifference.degreePerUnitX / diagonal * 100).toFixed(3)),
		y: Number.parseFloat((scalesWithMaxDifference.degreePerUnitY / diagonal * 100).toFixed(3))
	};
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
 * normalize image dimensions to fit in the default 500*500 pixel-sized graph
 * @param dimensions Dimensions: { width: number, height: number};
 * @return normalized Dimensions object
 */
export function normalizeImageDimensions(dimensions: Dimensions) {
	let res: Dimensions;
	let width;
	let height;
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
 * @param size The normalized size of the image for the map
 * @param point The (x,y) pair for the point to be shifted
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
	// Rotate point counterclockwise.
	const xRotated = point.x * Math.cos(angleRad) - point.y * Math.sin(angleRad);
	const yRotated = point.x * Math.sin(angleRad) + point.y * Math.cos(angleRad);
	// Rotated point to return.
	const p: CartesianPoint = { x: xRotated, y: yRotated };
	return p;
}
