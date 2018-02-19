/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { State } from './state';

export enum ActionType {
	RequestMetersDetails = 'REQUEST_METERS_DETAILS',
	ReceiveMetersDetails = 'RECEIVE_METERS_DETAILS',

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

	UpdateSelectedMeters = 'UPDATE_SELECTED_METERS',
	UpdateSelectedGroups = 'UPDATE_SELECTED_GROUPS',
	UpdateBarDuration = 'UPDATE_BAR_DURATION',
	ChangeChartToRender = 'CHANGE_CHART_TO_RENDER',
	ChangeBarStacking = 'CHANGE_BAR_STACKING',
	ChangeGraphZoom = 'CHANGE_GRAPH_ZOOM',
	UpdateCompareInterval = 'UPDATE_COMPARE_INTERVAL',
	UpdateCompareDuration = 'UPDATE_COMPARE_DURATION',

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
	RequestPreferences = 'REQUEST_PREFERENCES',
	ReceivePreferences = 'RECEIVE_PREFERENCES',
	MarkPreferencesNotSubmitted = 'MARK_PREFERENCES_NOT_SUBMITTED',
	MarkPreferencesSubmitted = 'MARK_PREFERENCES_SUBMITTED'
}

/**
 * The type of the redux-thunk dispatch function.
 */
export type Dispatch = Dispatch<State>;

/**
 * The type of the redux-thunk getState function.
 */
export type GetState = () => State;

/**
 * The type of promissory actions used in the project.
 * Returns a promise, no extra argument, uses the global state.
 */
export type Thunk = ThunkAction<Promise<any>, State, void>;
