export class CartesianPoint {
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export class GPSPoint {
	latitude: number;
	longitude: number;
	constructor(latitude: number, longitude: number) {
		this.latitude = latitude;
		this.longitude = longitude;
	}
}

export function calibrate(gpsCoordinates: GPSPoint[], graphCoordinates: CartesianPoint[], imageDimentions: number[]) {
	const oppositeCornerX = imageDimentions[0];
	const oppositeCornerY = imageDimentions[1];
	// calculate scale by taking average of (n choose 2) of data points;
	let scales = [];
	for (let i = 0; i < gpsCoordinates.length; i++) {
		for (let j = i+1; j < gpsCoordinates.length; j++) {
			let chooseGPSCoordinates = [gpsCoordinates[i],gpsCoordinates[j]];
			let chooseGraphCoordinates = [graphCoordinates[i],graphCoordinates[j]];
			let mapScale = calculateScale(chooseGPSCoordinates, chooseGraphCoordinates);
			scales.push(mapScale);
		}
	}
	let XScaleSum = 0;
	let YScaleSum = 0;
	let numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i][xIndex];
		YScaleSum += scales[i][yIndex];
	}
	const degreePerUnitX = XScaleSum/numDataPoints;
	const degreePerUnitY = YScaleSum/numDataPoints;

	// calculate gps coordinates for origin and the point on its opposite corner;
	let originLatitude = gpsCoordinates[0][latitudeIndex] - degreePerUnitY * graphCoordinates[0][yIndex];
	let originLongitude = gpsCoordinates[0][longitudeIndex] - degreePerUnitX * graphCoordinates[0][xIndex];
	let originCoordinate = [originLatitude, originLongitude];

	let oppositeCornerLatitude = originLatitude + oppositeCornerY * degreePerUnitY;
	let oppositeCornerLongitude = originLongitude + oppositeCornerX * degreePerUnitX;
	let oppositeCornerCoordinate = [oppositeCornerLatitude, oppositeCornerLongitude];

}

function calculateScale(gpsCoordinates: number[][], graphCoordinates: number[][]) {
	let deltaLatitude = gpsCoordinates[0][latitudeIndex] - gpsCoordinates[1][latitudeIndex];
	let deltaYInUnits = graphCoordinates[0][yIndex] - graphCoordinates[1][yIndex];
	let degreePerUnitY = deltaLatitude/deltaYInUnits;

	let deltaLongitude = gpsCoordinates[0][longitudeIndex] - gpsCoordinates[1][longitudeIndex];
	let deltaXInUnits = graphCoordinates[0][xIndex] - graphCoordinates[1][xIndex];
	let degreePerUnitX = deltaLongitude/deltaXInUnits;

	return [degreePerUnitX, degreePerUnitY];
}
