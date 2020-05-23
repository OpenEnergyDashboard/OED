
export enum MapModeTypes {
	initiate = 'initiate',
	calibrate = 'calibrate',
	display = 'display',
}

export interface ChangeMapModeAction {

}

export type MapAction =
	| ChangeMapModeAction;



export interface MapState {
	mode: MapModeTypes;
	isLoading: boolean;
	source: string;
}

export interface MapCalibrateState {
	numDataPoint: number,
	graphCoordinates: number[],
	gpsCoordinates: number[], //Todo: check gps storing object and refactor data structure to store gps coordinates;
}
