
export enum MapModeTypes {
	initiate = 'initiate',
	calibrate = 'calibrate',
	display = 'display',
}

export interface MapState {
	mode: MapModeTypes,
	isLoading: boolean,
	initiate: MapInitiateState,
	calibrate: MapCalibrateState,
}

export interface MapInitiateState {
	source: string,
}

export  interface MapCalibrateState {
	numDataPoint: number,
	graphCoordinates: number[],
	gpsCoordinates: number[], //Todo: check gps storing object and refactor data structure to store gps coordinates;
}
