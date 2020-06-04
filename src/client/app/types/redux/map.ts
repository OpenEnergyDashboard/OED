/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
