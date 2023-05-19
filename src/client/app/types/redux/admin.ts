/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PreferenceRequestItem } from '../items';
import { ChartTypes } from './graph';
import { LanguageTypes } from './i18n';
import { ActionType } from './actions';
import { AreaUnitType } from 'utils/getAreaUnitConversion';

export type AdminAction =
	| UpdateImportMeterAction
	| UpdateDisplayTitleAction
	| UpdateDefaultChartToRenderAction
	| UpdateDefaultLanguageAction
	| ToggleDefaultBarStackingAction
	| ToggleDefaultAreaNormalizationAction
	| RequestPreferencesAction
	| ReceivePreferencesAction
	| MarkPreferencesNotSubmittedAction
	| UpdateDefaultTimeZone
	| UpdateDefaultWarningFileSize
	| UpdateDefaultFileSizeLimit
	| MarkPreferencesSubmittedAction
	| UpdateCikAndDBViews
	| UpdateDefaultAreaUnitAction
	| UpdateDefaultMeterReadingFrequencyAction;

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

export interface ToggleDefaultAreaNormalizationAction {
	type: ActionType.ToggleDefaultAreaNormalization;
}

export interface UpdateDefaultAreaUnitAction {
	type: ActionType.UpdateDefaultAreaUnit;
	defaultAreaUnit: AreaUnitType;
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
	defaultMeterReadingFrequency: string;
}

export interface UpdateDefaultWarningFileSize {
	type: ActionType.UpdateDefaultWarningFileSize;
	defaultWarningFileSize: number;
}

export interface UpdateDefaultFileSizeLimit {
	type: ActionType.UpdateDefaultFileSizeLimit;
	defaultFileSizeLimit: number;
}

export interface UpdateCikAndDBViews {
	type: ActionType.UpdateCikAndDBViews;
}

export interface UpdateDefaultMeterReadingFrequencyAction {
	type: ActionType.UpdateDefaultMeterReadingFrequency;
	defaultMeterReadingFrequency: string;
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
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
	isUpdatingCikAndDBViews: boolean;
	defaultAreaNormalization: boolean;
	defaultAreaUnit: AreaUnitType;
	defaultMeterReadingFrequency: string;
}
