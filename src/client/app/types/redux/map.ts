/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CalibratedPoint, CalibrationResult, GPSPoint } from '../../utils/calibration';

/**
 * 'initiate', 'calibrate' or 'unavailable'
 */
export enum CalibrationModeTypes {
	initiate = 'initiate',
	calibrate = 'calibrate',
	unavailable = 'unavailable'
}



/**
 * data format stored in the database
 * @param id
 * @param name
 * @param note
 * @param filename
 * @param modifiedDate
 * @param origin
 * @param opposite
 * @param mapSource
 */
export interface MapData {
	id: number;
	name: string;
	displayable: boolean;
	note?: string;
	filename: string;
	modifiedDate: string;
	origin?: GPSPoint;
	opposite?: GPSPoint;
	mapSource: string;
	circleSize: number;
}

/**
 *  Data format used keep track of map's state
 *  @param id {number} id <= -1 means it's a new map;
 *  @param name
 *  @param displayable
 */

export interface MapMetadata {
	id: number;
	name: string;
	displayable: boolean;
	note?: string;
	filename: string;
	modifiedDate: string;
	origin?: GPSPoint;
	opposite?: GPSPoint;
	mapSource: string;
	northAngle: number;
	circleSize: number;
	// image: HTMLImageElement;
	imgHeight: number;
	imgWidth: number;
	calibrationMode?: CalibrationModeTypes;
	currentPoint?: CalibratedPoint;
	calibrationSet: CalibratedPoint[];
	calibrationResult?: CalibrationResult;
}

/**
 * Stores settings for calibration
 */
export interface CalibrationSettings {
	showGrid: boolean;
}

/**
 * @param mapID <= -1 means it's a new map;
 */
interface MapMetadataByID extends Record<number, MapMetadata> { }


export interface MapState {
	isLoading: boolean;
	byMapID: MapMetadataByID;
	selectedMap: number;
	calibratingMap: number;
	editedMaps: MapMetadataByID; // Holds all maps that have been edited locally
	// Maps the app is currently attempting to upload map changes
	submitting: number[];
	newMapCounter: number;
	calibrationSettings: CalibrationSettings;
}
