/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PreferenceRequestItem } from '../items';
import { ChartTypes } from './graph';
import { LanguageTypes } from './i18n';
import { ActionType } from './actions';

export type AdminAction =
	| UpdateImportMeterAction
	| UpdateDisplayTitleAction
	| UpdateDefaultChartToRenderAction
	| UpdateDefaultLanguageAction
	| ToggleDefaultBarStackingAction
	| RequestPreferencesAction
	| ReceivePreferencesAction
	| MarkPreferencesNotSubmittedAction
	| UpdateDefaultTimeZone
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

export interface UpdateDefaultTimeZone {
	type: ActionType.UpdateDefaultTimeZone;
	timeZone: string;
}

export interface UpdateDefaultLanguageAction {
	type: ActionType.UpdateDefaultLanguage;
	defaultLanguage: LanguageTypes;
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
	defaultTimeZone: string;
	defaultLanguage: LanguageTypes;
	isFetching: boolean;
	submitted: boolean;
}
