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
	UpdateSelectedAreaUnit = 'UPDATE_SELECTED_AREA_UNIT',
	UpdateSelectedConversion = 'UPDATE_SELECTED_CONVERSION',
	UpdateBarDuration = 'UPDATE_BAR_DURATION',
	ChangeChartToRender = 'CHANGE_CHART_TO_RENDER',
	ChangeBarStacking = 'CHANGE_BAR_STACKING',
	ToggleAreaNormalization = 'TOGGLE_AREA_NORMALIZATION',
	ToggleShowMinMax = 'TOGGLE_SHOW_MIN_MAX',
	ChangeGraphZoom = 'CHANGE_GRAPH_ZOOM',
	ChangeSliderRange = 'CHANGE_SLIDER_RANGE',
	ResetRangeSliderStack = 'RESET_RANGE_SLIDER_STACK',
	ToggleOptionsVisibility = 'TOGGLE_OPTIONS_VISIBILITY',
	UpdateComparePeriod = 'UPDATE_COMPARE_PERIOD',
	ChangeCompareSortingOrder = 'CHANGE_COMPARE_SORTING_ORDER',
	SetHotlinked = 'SET_HOTLINKED',
	UpdateLineGraphRate = 'UPDATE_LINE_GRAPH_RATE',
	ConfirmGraphRenderOnce = 'CONFIRM_GRAPH_RENDER_ONCE',

	RequestGroupsDetails = 'REQUEST_GROUPS_DETAILS',
	ReceiveGroupsDetails = 'RECEIVE_GROUPS_DETAILS',
	RequestGroupChildren = 'REQUEST_GROUP_CHILDREN',
	ReceiveGroupChildren = 'RECEIVE_GROUP_CHILDREN',
	RequestAllGroupsChildren = 'REQUEST_ALL_GROUPS_CHILDREN',
	ReceiveAllGroupsChildren = 'RECEIVE_ALL_GROUPS_CHILDREN',
	ChangeDisplayedGroups = 'CHANGE_DISPLAYED_GROUPS',
	ConfirmEditedGroup = 'CONFIRM_EDITED_GROUP',
	ConfirmGroupsFetchedOnce = 'CONFIRM_GROUPS_FETCHED_ONCE',
	ConfirmAllGroupsChildrenFetchedOnce = 'CONFIRM_ALL_GROUPS_CHILDREN_FETCHED_ONCE',

	UpdateImportMeter = 'UPDATE_IMPORT_METER',
	UpdateDisplayTitle = 'UPDATE_DISPLAY_TITLE',
	UpdateDefaultChartToRender = 'UPDATE_DEFAULT_CHART_TO_RENDER',
	ToggleDefaultBarStacking = 'TOGGLE_DEFAULT_BAR_STACKING',
	ToggleDefaultAreaNormalization = 'TOGGLE_DEFAULT_AREA_NORMALIZATION',
	UpdateDefaultAreaUnit = 'UPDATE_DEFAULT_AREA_UNIT',
	UpdateDefaultTimeZone = 'UPDATE_DEFAULT_TIMEZONE',
	UpdateDefaultLanguage = 'UPDATE_DEFAULT_LANGUAGE',
	RequestPreferences = 'REQUEST_PREFERENCES',
	ReceivePreferences = 'RECEIVE_PREFERENCES',
	MarkPreferencesNotSubmitted = 'MARK_PREFERENCES_NOT_SUBMITTED',
	MarkPreferencesSubmitted = 'MARK_PREFERENCES_SUBMITTED',
	UpdateDefaultWarningFileSize = 'UPDATE_DEFAULT_WARNING_FILE_SIZE',
	UpdateDefaultFileSizeLimit = 'UPDATE_DEFAULT_FILE_SIZE_LIMIT',
	ToggleWaitForCikAndDB = 'TOGGLE_WAIT_FOR_CIK_AND_DB',
	UpdateDefaultMeterReadingFrequency = 'UPDATE_DEFAULT_METER_READING_FREQUENCY',
	UpdateDefaultMeterMinimumValue = 'UPDATE_DEFAULT_METER_MINIMUM_VALUE',
	UpdateDefaultMeterMaximumValue = 'UPDATE_DEFAULT_METER_MAXIMUM_VALUE',
	UpdateDefaultMeterMinimumDate = 'UPDATE_DEFAULT_METER_MINIMUM_DATE',
	UpdateDefaultMeterMaximumDate = 'UPDATE_DEFAULT_METER_MAXIMUM_DATE',
	UpdateDefaultMeterReadingGap = 'UPDATE_DEFAULT_METER_READING_GAP',
	UpdateDefaultMeterMaximumErrors = 'UPDATE_DEFAULT_METER_MAXIMUM_ERRORS',
	UpdateDefaultMeterDisableChecks = 'UPDATE_DEFAULT_METER_DISABLE_CHECKS',

	UpdateSelectedLanguage = 'UPDATE_SELECTED_LANGUAGE',

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

	ReceiveUnitsDetails = 'RECEIVE_UNITS_DETAILS',
	RequestUnitsDetails = 'REQUEST_UNITS_DETAILS',
	ChangeDisplayedUnits = 'CHANGE_DISPLAYED_UNITS',
	SubmitEditedUnit = 'SUBMIT_EDITED_UNIT',
	ConfirmEditedUnit = 'CONFIRM_EDITED_UNIT',
	DeleteSubmittedUnit = 'DELETE_SUBMITTED_UNIT',
	ConfirmUnitsFetchedOnce = 'CONFIRM_UNITS_FETCHED_ONCE',

	ReceiveMetersDetails = 'RECEIVE_METERS_DETAILS',
	RequestMetersDetails = 'REQUEST_METERS_DETAILS',
	ChangeDisplayedMeters = 'CHANGE_DISPLAYED_METERS',
	EditMeterDetails = 'EDIT_METER_DETAILS',
	SubmitEditedMeter = 'SUBMIT_EDITED_METER',
	ConfirmEditedMeter = 'CONFIRM_EDITED_METER',
	ConfirmAddMeter = 'CONFIRM_ADD_METER',
	DeleteSubmittedMeter = 'DELETE_SUBMITTED_METER',
	ConfirmMetersFetchedOnce = 'CONFIRM_METERS_FETCHED_ONCE',

	ReceiveConversionsDetails = 'RECEIVE_CONVERSIONS_DETAILS',
	RequestConversionsDetails = 'REQUEST_CONVERSIONS_DETAILS',
	ChangeDisplayedConversions = 'CHANGE_DISPLAYED_CONVERSIONS',
	EditConversionDetails = 'EDIT_CONVERSION_DETAILS',
	SubmitEditedConversion = 'SUBMIT_EDITED_CONVERSION',
	ConfirmEditedConversion = 'CONFIRM_EDITED_CONVERSION',
	DeleteEditedConversion = 'DELETE_EDITED_CONVERSION',
	DeleteSubmittedConversion = 'DELETE_SUBMITTED_CONVERSION',
	DeleteConversion = 'DELETE_CONVERSION',
	ConfirmConversionsFetchedOnce = 'CONFIRM_CONVERSIONS_FETCHED_ONCE',
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
