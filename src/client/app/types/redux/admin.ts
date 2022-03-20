/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PreferenceRequestItem } from '../items';
import { ChartTypes } from './graph';
import { LanguageTypes } from './i18n';
import { ActionType } from './actions';
import { TimeZoneOption } from '../timezone';

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
	| UpdateDefaultWarningFileSize
	| UpdateDefaultFileSizeLimit
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
	timeZone: TimeZoneOption;
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

export interface UpdateDefaultWarningFileSize {
	type: ActionType.UpdateDefaultWarningFileSize;
	defaultWarningFileSize: number;
}

export interface UpdateDefaultFileSizeLimit {
	type: ActionType.UpdateDefaultFileSizeLimit;
	defaultFileSizeLimit: number;
}

export interface AdminState {
	selectedMeter: number | null;
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultTimeZone: TimeZoneOption;
	defaultLanguage: LanguageTypes;
	isFetching: boolean;
	submitted: boolean;
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
}
