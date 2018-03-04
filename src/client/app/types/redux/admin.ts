/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PreferenceRequestItem, SelectOption } from '../items';
import { ChartTypes } from './graph';
import { ActionType } from './actions';

export type AdminAction =
	| UpdateImportMeterAction
	| UpdateDisplayTitleAction
	| UpdateDefaultChartToRenderAction
	| ToggleDefaultBarStackingAction
	| ToggleDefaultHideOptionsAction
	| RequestPreferencesAction
	| ReceivePreferencesAction
	| MarkPreferencesNotSubmittedAction
	| MarkPreferencesSubmittedAction;

export interface UpdateImportMeterAction {
	type: ActionType.UpdateImportMeter;
	meterID: number;
}

export interface UpdateDisplayTitleAction {
	type: ActionType.UpdateDisplayTitle;
	displayTitle: string;
}

export interface UpdateDefaultChartToRenderAction {
	type: ActionType.UpdateDefaultChartToRender;
	defaultChartToRender: ChartTypes;
}

export interface ToggleDefaultBarStackingAction {
	type: ActionType.ToggleDefaultBarStacking;
}

export interface ToggleDefaultHideOptionsAction {
	type: ActionType.ToggleDefaultHideOptions;
}

export interface RequestPreferencesAction {
	type: ActionType.RequestPreferences;
}

export interface ReceivePreferencesAction {
	type: ActionType.ReceivePreferences;
	data: PreferenceRequestItem;
}

export interface MarkPreferencesNotSubmittedAction {
	type: ActionType.MarkPreferencesNotSubmitted;
}

export interface MarkPreferencesSubmittedAction {
	type: ActionType.MarkPreferencesSubmitted;
}

export interface AdminState {
	selectedMeter: number | null;
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultHideOptions: boolean;
	isFetching: boolean;
	submitted: boolean;
}
