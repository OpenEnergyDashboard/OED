import {ActionType} from './actions';

export enum MapModeTypes {
	initiate = 'initiate',
	calibrate = 'calibrate',
	display = 'display'
}

export interface ChangeMapModeAction {
	type: ActionType.UpdateMapMode;
	nextMode: MapModeTypes;
}

export interface UpdateMapSourceAction {
	type: ActionType.UpdateMapSource;
	imageSource: string;
}


export type MapAction =
	| ChangeMapModeAction
	| UpdateMapSourceAction;



export interface MapState {
	mode: MapModeTypes;
	isLoading: boolean;
	source: string;
}

export interface MapCalibrateState {
	numDataPoint: number;
	graphCoordinates: number[];
	gpsCoordinates: number[]; // Todo: check gps storing object and refactor data structure to store gps coordinates;
}
