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
}

export interface Dimensions {
	width: number;
	height: number;
}

export default function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions) {
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// calculate scale by taking average of (n choose 2) of data points;
	let scales: MapScale[] = [];
	for (let i = 0; i < calibrationSet.length; i++) {
		for (let j = i+1; j < calibrationSet.length; j++) {
			let mapScale: MapScale = calculateScale(calibrationSet[i], calibrationSet[j]);
			scales.push(mapScale);
		}
	}
	let XScaleSum = 0;
	let YScaleSum = 0;
	let numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i].degreePerUnitX;
		YScaleSum += scales[i].degreePerUnitY;
	}
	const degreePerUnitX = XScaleSum/numDataPoints;
	const degreePerUnitY = YScaleSum/numDataPoints;

	// calculate gps coordinates for origin and the point on its opposite corner;
	let originLatitude = calibrationSet[0].getGPS().latitude - degreePerUnitY * calibrationSet[0].getCartesian().y;
	let originLongitude = calibrationSet[0].getGPS().longitude - degreePerUnitX * calibrationSet[0].getCartesian().x;
	let originCoordinate = [originLatitude, originLongitude];
	//
	// let oppositeCornerLatitude = originLatitude + oppositeCornerY * degreePerUnitY;
	// let oppositeCornerLongitude = originLongitude + oppositeCornerX * degreePerUnitX;
	// let oppositeCornerCoordinate = [oppositeCornerLatitude, oppositeCornerLongitude];
	// return [originCoordinate, oppositeCornerCoordinate];

	// calculate gps coordinates for top-left and down-right corner
	let topLeftLatitude = originLatitude + normalizedDimensions.height * degreePerUnitY;
	let topLeftLongitude = originLongitude;
	let topLeftCoordinate = [topLeftLatitude, topLeftLongitude];

	let downRightCornerLatitude = originLatitude;
	let downRightCornerLongitude = originLongitude + normalizedDimensions.width * degreePerUnitX;
	let downRightCornerCoordinate = [downRightCornerLatitude, downRightCornerLongitude];
	return [topLeftCoordinate, downRightCornerCoordinate];
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
