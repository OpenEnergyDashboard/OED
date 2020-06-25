/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface CartesianPoint {
	x: number;
	y: number;
}

export interface GPSPoint {
	latitude: number;
	longitude: number;
}

interface MapScale {
	degreePerUnitX: number;
	degreePerUnitY: number;
}

export class CalibratedPoint {
	private cartesian: CartesianPoint;
	private gps: GPSPoint;

	constructor() {
		this.cartesian = new class implements CartesianPoint {
			x: number;
			y: number;
		};
		this.gps = new class implements GPSPoint {
			latitude: number;
			longitude: number;
		}

	}

	public setCartesian(cartesian: CartesianPoint) {
		this.cartesian = cartesian;
	}

	public setGPS(gps: GPSPoint) {
		this.gps = gps;
	}

	public isComplete() {
		return this.cartesian !== undefined && this.gps !== undefined;
	}

	public hasCartesian() {
		return this.cartesian !== undefined;
	}

	public getGPS() {
		return this.gps;
	}

	public getGPSString() {
		return `latitude: ${this.gps.latitude}, longitude: ${this.gps.longitude}`;
	}

	public getCartesian() {
		return this.cartesian;
	}

	public getCartesianString() {
		return `x: ${this.cartesian.x}, y: ${this.cartesian.y}`;
	}

	public clone() {
		let copy = new CalibratedPoint();
		copy.setCartesian(this.cartesian);
		copy.setGPS(this.gps);
		return copy;
	}
}

export interface Dimensions {
	width: number;
	height: number;
}

export default function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions) {
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
	let originLatitude = calibrationSet[0].getGPS().latitude - degreePerUnitY * calibrationSet[0].getCartesian().y;
	let originLongitude = calibrationSet[0].getGPS().longitude - degreePerUnitX * calibrationSet[0].getCartesian().x;
	let originCoordinate = [originLatitude, originLongitude];

	// uncomment this block to get gps coordinates of the opposite corner from origin
	// let oppositeCornerLatitude = originLatitude + oppositeCornerY * degreePerUnitY;
	// let oppositeCornerLongitude = originLongitude + oppositeCornerX * degreePerUnitX;
	// let oppositeCornerCoordinate = [oppositeCornerLatitude, oppositeCornerLongitude];
	// return [originCoordinate, oppositeCornerCoordinate];

	// calculate gps coordinates for top-left and down-right corner
	let topLeftLatitude = originLatitude + normalizedDimensions.height * degreePerUnitY;
	let topLeftLongitude = originLongitude;
	let topLeftCoordinate = [topLeftLatitude.toFixed(6), topLeftLongitude.toFixed(6)];

	let downRightLatitude = originLatitude;
	let downRightLongitude = originLongitude + normalizedDimensions.width * degreePerUnitX;
	let downRightCoordinate = [downRightLatitude.toFixed(6), downRightLongitude.toFixed(6)];

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
	const result = `Max error: x: ${maxErrorPercentage.x}%, y: ${maxErrorPercentage.y}%;
	TopLeftCorner: ${topLeftCoordinate[0]},${topLeftCoordinate[1]}, DownRightCorner: ${downRightCoordinate[0]}, ${downRightCoordinate[1]}`;
	return result;
}

function calculateScale(p1: CalibratedPoint, p2: CalibratedPoint) {
	let deltaLatitude = p1.getGPS().latitude - p2.getGPS().latitude;
	let deltaYInUnits = p1.getCartesian().y - p2.getCartesian().y;
	let degreePerUnitY = deltaLatitude / deltaYInUnits;

	let deltaLongitude = p1.getGPS().longitude - p2.getGPS().longitude;
	let deltaXInUnits = p1.getCartesian().x - p2.getCartesian().x;
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
