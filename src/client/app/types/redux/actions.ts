/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { State } from './state';

export enum ActionType {

	RequestCurrentUser = 'REQUEST_CURRENT_USER',
	ReceiveCurrentUser = 'RECEIVE_CURRENT_USER',
	ClearCurrentUser = 'CLEAR_CURRENT_USER',

	RequestVersion = 'REQUEST_VERSION',
	ReceiveVersion = 'RECEIVE_VERSION',

	UpdateUnsavedChanges = 'UPDATE_UNSAVED_CHANGES',
	RemoveUnsavedChanges = 'REMOVE_UNSAVED_CHANGES',
	FlipLogOutState = 'FLIP_LOG_OUT_STATE',

	RequestMetersDetails = 'REQUEST_METERS_DETAILS',
	ReceiveMetersDetails = 'RECEIVE_METERS_DETAILS',
	ChangeDisplayedMeters = 'CHANGE_DISPLAYED_METERS',
	EditMeterDetails = 'EDIT_METER_DETAILS',
	SubmitEditedMeter = 'SUBMIT_EDITED_METER',
	ConfirmEditedMeter = 'CONFIRM_EDITED_METER',

	ShowNotification = 'SHOW_NOTIFICATION',
	ClearNotifications = 'CLEAR_NOTIFICATIONS',

	RequestGroupBarReadings = 'REQUEST_GROUP_BAR_READINGS',
	ReceiveGroupBarReadings = 'RECEIVE_GROUP_BAR_READINGS',
	RequestMeterBarReadings = 'REQUEST_METER_BAR_READINGS',
	ReceiveMeterBarReadings = 'RECEIVE_METER_BAR_READINGS',

	RequestGroupLineReadings = 'REQUEST_GROUP_LINE_READINGS',
	ReceiveGroupLineReadings = 'RECEIVE_GROUP_LINE_READINGS',
	RequestMeterLineReadings = 'REQUEST_METER_LINE_READINGS',
	ReceiveMeterLineReadings = 'RECEIVE_METER_LINE_READINGS',

	RequestGroupCompareReadings = 'REQUEST_GROUP_COMPARE_READINGS',
	ReceiveGroupCompareReadings = 'RECEIVE_GROUP_COMPARE_READINGS',
	RequestMeterCompareReadings = 'REQUEST_METER_COMPARE_READINGS',
	ReceiveMeterCompareReadings = 'RECEIVE_METER_COMPARE_READINGS',

	UpdateSelectedMeters = 'UPDATE_SELECTED_METERS',
	UpdateSelectedGroups = 'UPDATE_SELECTED_GROUPS',
	UpdateSelectedUnit = 'UPDATE_SELECTED_UNIT',
	UpdateBarDuration = 'UPDATE_BAR_DURATION',
	ChangeChartToRender = 'CHANGE_CHART_TO_RENDER',
	ChangeBarStacking = 'CHANGE_BAR_STACKING',
	ChangeGraphZoom = 'CHANGE_GRAPH_ZOOM',
	ChangeSliderRange = 'CHANGE_SLIDER_RANGE',
	ResetRangeSliderStack = 'RESET_RANGE_SLIDER_STACK',
	SetOptionsVisibility = 'SET_OPTIONS_VISIBILITY',
	UpdateComparePeriod = 'UPDATE_COMPARE_PERIOD',
	ChangeCompareSortingOrder = 'CHANGE_COMPARE_SORTING_ORDER',
	SetHotlinked = 'SET_HOTLINKED',

	RequestGroupsDetails = 'REQUEST_GROUPS_DETAILS',
	ReceiveGroupsDetails = 'RECEIVE_GROUPS_DETAILS',
	RequestGroupChildren = 'REQUEST_GROUP_CHILDREN',
	ReceiveGroupChildren = 'RECEIVE_GROUP_CHILDREN',
	ChangeSelectedChildGroupsPerGroup = 'CHANGE_SELECTED_CHILD_GROUPS_PER_GROUP',
	ChangeSelectedChildMetersPerGroup = 'CHANGE_SELECTED_CHILD_METERS_PER_GROUP',
	ChangeDisplayedGroups = 'CHANGE_DISPLAYED_GROUPS',

	ChangeGroupsUIDisplayMode = 'CHANGE_GROUPS_UI_DISPLAY_MODE',
	CreateNewBlankGroup = 'CREATE_NEW_BLANK_GROUP',
	BeginEditingGroup = 'BEGIN_EDITING_GROUP',
	EditGroupName = 'EDIT_GROUP_NAME',
	EditGroupGPS = 'EDIT_GROUP_GPS',
	EditGroupDisplayable = 'EDIT_GROUP_DISPLAYABLE',
	EditGroupNote = 'EDIT_GROUP_NOTE',
	EditGroupArea = 'EDIT_GROUP_AREA',
	ChangeChildGroups = 'CHANGE_CHILD_GROUPS',
	ChangeChildMeters = 'CHANGE_CHILD_METERS',
	MarkGroupInEditingSubmitted = 'MARK_GROUP_IN_EDITING_SUBMITTED',
	MarkGroupInEditingNotSubmitted = 'MARK_GROUP_IN_EDITING_NOT_SUBMITTED',
	MarkGroupInEditingClean = 'MARK_GROUP_IN_EDITING_CLEAN',
	MarkGroupInEditingDirty = 'MARK_GROUP_IN_EDITING_DIRTY',
	MarkGroupsByIDOutdated = 'MARK_GROUPS_BY_ID_OUTDATED',
	MarkOneGroupOutdated = 'MARK_ONE_GROUP_OUTDATED',

	UpdateImportMeter = 'UPDATE_IMPORT_METER',
	UpdateDisplayTitle = 'UPDATE_DISPLAY_TITLE',
	UpdateDefaultChartToRender = 'UPDATE_DEFAULT_CHART_TO_RENDER',
	ToggleDefaultBarStacking = 'TOGGLE_DEFAULT_BAR_STACKING',
	UpdateDefaultTimeZone = 'UPDATE_DEFAULT_TIMEZONE',
	UpdateDefaultLanguage = 'UPDATE_DEFAULT_LANGUAGE',
	RequestPreferences = 'REQUEST_PREFERENCES',
	ReceivePreferences = 'RECEIVE_PREFERENCES',
	MarkPreferencesNotSubmitted = 'MARK_PREFERENCES_NOT_SUBMITTED',
	MarkPreferencesSubmitted = 'MARK_PREFERENCES_SUBMITTED',
	UpdateDefaultWarningFileSize = 'UPDATE_DEFAULT_WARNING_FILE_SIZE',
	UpdateDefaultFileSizeLimit = 'UPDATE_DEFAULT_FILE_SIZE_LIMIT',

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

	RequestConversionDetails = 'REQUEST_CONVERSION_DETAILS',
	ReceiveConversionDetails = 'RECEIVE_CONVERSION_DETAILS',
	EditConversionDetails = 'EDIT_CONVERSION_DETAILS',
	SubmitEditedConversion = 'SUBMIT_EDITED_CONVERSION',
	ConfirmEditedConversion = 'CONFIRM_EDITED_CONVERSION',
	DeleteConversion = 'DELETE_CONVERSION',
	RequestUnitsDetails = 'REQUEST_UNITS_DETAILS'
	
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
