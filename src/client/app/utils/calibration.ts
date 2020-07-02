/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface CartesianPoint {
	x: number;
	y: number;
}

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

export class CalibratedPoint {
	cartesian: CartesianPoint;
	gps: GPSPoint;

	constructor() {
		this.cartesian = new class implements CartesianPoint {
			x: number;
			y: number;
		};
		this.gps = new class implements GPSPoint {
			longitude: number;
			latitude: number;
		}
	}

	public isComplete() {
		return this.cartesian !== undefined && this.gps !== undefined;
	}

	public hasCartesian() {
		return this.cartesian !== undefined;
	}

	public getGPSString() {
		return `latitude: ${this.gps.latitude}, longitude: ${this.gps.longitude}`;
	}

	public getCartesianString() {
		return `x: ${this.cartesian.x}, y: ${this.cartesian.y}`;
	}
}

export interface CalibrationResult {
	maxError?: {
		x: number,
		y: number,
	},
	origin: GPSPoint,
	opposite: GPSPoint,
}

export interface Dimensions {
	width: number;
	height: number;
}

export function calculateScaleFromEndpoints(origin: GPSPoint, opposite: GPSPoint, imageDimensions: Dimensions) {
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	const originComplete: CalibratedPoint = new CalibratedPoint();
	originComplete.gps = origin;
	originComplete.cartesian = {x: 0, y: 0};
	const oppositeComplete: CalibratedPoint = new CalibratedPoint();
	oppositeComplete.gps = opposite;
	oppositeComplete.cartesian = {x: normalizedDimensions.width, y: normalizedDimensions.height};
	let mapScale: MapScale = calculateScale(originComplete, oppositeComplete);
	return mapScale;
}

export function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions) {
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// calculate (n choose 2) scales for each pair of data points;
	let scales: MapScale[] = [];
	for (let i = 0; i < calibrationSet.length; i++) {
		for (let j = i+1; j < calibrationSet.length; j++) {
			let mapScale: MapScale = calculateScale(calibrationSet[i], calibrationSet[j]);
			scales.push(mapScale);
		}
	}
	// take average to get the calibrated scale;
	let XScaleSum = 0;
	let YScaleSum = 0;
	let numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i].degreePerUnitX;
		YScaleSum += scales[i].degreePerUnitY;
	}
	const degreePerUnitX = XScaleSum/numDataPoints;
	const degreePerUnitY = YScaleSum/numDataPoints;

	// calculate gps coordinates for the origin;
	let originLatitude = calibrationSet[0].gps.latitude - degreePerUnitY * calibrationSet[0].cartesian.y;
	let originLongitude = calibrationSet[0].gps.longitude - degreePerUnitX * calibrationSet[0].cartesian.x;
	let originCoordinate = [originLatitude, originLongitude];

	// uncomment this block to get gps coordinates of the opposite corner from origin
	// let oppositeCornerLatitude = originLatitude + oppositeCornerY * degreePerUnitY;
	// let oppositeCornerLongitude = originLongitude + oppositeCornerX * degreePerUnitX;
	// let oppositeCornerCoordinate = [oppositeCornerLatitude, oppositeCornerLongitude];
	// return [originCoordinate, oppositeCornerCoordinate];

	// calculate gps coordinates for top-left and down-right corner
	let topLeftLatitude = originLatitude + normalizedDimensions.height * degreePerUnitY;
	let topLeftLongitude = originLongitude;
	let topLeftCoordinate: GPSPoint = {
		latitude: Number(topLeftLatitude.toFixed(6)),
		longitude: Number(topLeftLongitude.toFixed(6)),
	};

	let downRightLatitude = originLatitude;
	let downRightLongitude = originLongitude + normalizedDimensions.width * degreePerUnitX;
	let downRightCoordinate: GPSPoint = {
		latitude: Number(downRightLatitude.toFixed(6)),
		longitude: Number(downRightLongitude.toFixed(6)),
	};

	// calculate max error
	const diagonal = Math.sqrt(Math.pow(normalizedDimensions.width/degreePerUnitX, 2) + Math.pow(normalizedDimensions.height/degreePerUnitY, 2));
	let scalesWithMaxDifference: MapScale = {
		degreePerUnitX: 0,
		degreePerUnitY: 0,
	};
	let pointIndexWithMaxDifference = {
		x: -1,
		y: -1,
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
		x: Number.parseFloat((scalesWithMaxDifference.degreePerUnitX/diagonal * 100).toFixed(3)),
		y: Number.parseFloat((scalesWithMaxDifference.degreePerUnitY/diagonal * 100).toFixed(3))
	}
	const result: CalibrationResult = {
		maxError: maxErrorPercentage,
		origin: topLeftCoordinate,
		opposite: downRightCoordinate,
	}
	return result;
}

function calculateScale(p1: CalibratedPoint, p2: CalibratedPoint) {
	let deltaLatitude = p1.gps.latitude - p2.gps.latitude;
	let deltaYInUnits = p1.cartesian.y - p2.cartesian.y;
	let degreePerUnitY = deltaLatitude / deltaYInUnits;

	let deltaLongitude = p1.gps.longitude - p2.gps.longitude;
	let deltaXInUnits = p1.cartesian.x - p2.cartesian.x;
	let degreePerUnitX = deltaLongitude / deltaXInUnits;

	return {degreePerUnitX, degreePerUnitY};
}

/**
 * normalize image dimensions to fit in the default 500*500 pixel-sized graph
 * @param dimensions Dimensions: { width: number, height: number};
 * @return normalized Dimensions object
 */
function normalizeImageDimensions(dimensions: Dimensions) {
	let res: Dimensions;
	if (dimensions.width > dimensions.height) {
		const width = 500;
		const height = width/500*dimensions.height;
		res = {
			width: width,
			height: height
		};
	} else {
		const height = 500;
		const width = height/500*dimensions.width;
		res = {
			width: width,
			height: height,
		};
	}
	return res;
}

// Typescript functions to determine whether an object is one of these points
function isCartesian(object: any): object is CartesianPoint {
	return 'x' in object && 'y' in object;
}

function isGPS(object: any): object is GPSPoint {
	return 'latitude' in object && 'longitude' in object;
}
