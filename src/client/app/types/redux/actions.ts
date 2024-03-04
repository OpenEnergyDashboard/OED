/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { State } from './state';

export enum ActionType {

	UpdateUnsavedChanges = 'UPDATE_UNSAVED_CHANGES',
	RemoveUnsavedChanges = 'REMOVE_UNSAVED_CHANGES',
	FlipLogOutState = 'FLIP_LOG_OUT_STATE',

	UpdateCalibrationMode = 'UPDATE_MAP_MODE',
	UpdateSelectedMap = 'UPDATE_SELECTED_MAPS',
	UpdateMapSource = 'UPDATE_MAP_IMAGE',
	ChangeGridDisplay = 'CHANGE_GRID_DISPLAY',
	UpdateCurrentCartesian = 'UPDATE_CURRENT_CARTESIAN',
	ResetCurrentPoint = 'RESET_CURRENT_POINT',
	AppendCalibrationSet = 'APPEND_CALIBRATION_SET',
	UpdateCalibrationResults = 'UPDATE_CALIBRATION_RESULTS',
	RequestMapsDetails = 'REQUEST_MAP_DETAILS',
	ReceiveMapsDetails = 'RECEIVE_MAP_DETAILS',
	DeleteMap = 'DELETE_MAP',
	EditMapDetails = 'EDIT_MAP_DETAILS',
	SubmitEditedMap = 'SUBMIT_EDITED_MAP',
	ConfirmEditedMap = 'CONFIRM_EDITED_MAP',
	SetCalibration = 'SET_CALIBRATION',
	ResetCalibration = 'RESET_CALIBRATION',
	IncrementCounter = 'INCREMENT_COUNTER',
}

/**
 * The type of the redux-thunk dispatch function.
 * Uses the overloaded version from Redux-Thunk.
 */
export type Dispatch = ThunkDispatch<State, void, Action<any>>;

/**
 * The type of the redux-thunk getState function.
 */
export type GetState = () => State;

/**
 * The type of promissory actions used in the project.
 * Returns a promise, no extra argument, uses the global state.
 */
export type Thunk = ThunkAction<Promise<any>, State, void, Action>;
