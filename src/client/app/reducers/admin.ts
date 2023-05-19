/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ChartTypes } from '../types/redux/graph';
import { ActionType } from '../types/redux/actions';
import { AdminState, AdminAction } from '../types/redux/admin';
import { LanguageTypes } from '../types/redux/i18n';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { durationFormat } from '../utils/durationFormat';

const defaultState: AdminState = {
	selectedMeter: null,
	displayTitle: '',
	defaultChartToRender: ChartTypes.line,
	defaultBarStacking: false,
	defaultTimeZone: '',
	defaultLanguage: LanguageTypes.en,
	isFetching: false,
	submitted: true,
	defaultWarningFileSize: 5,
	defaultFileSizeLimit: 25,
	isUpdatingCikAndDBViews: false,
	defaultAreaNormalization: false,
	defaultAreaUnit: AreaUnitType.none,
	defaultMeterReadingFrequency: '00:15:00'
};

export default function admin(state = defaultState, action: AdminAction) {
	switch (action.type) {
		case ActionType.UpdateImportMeter:
			return {
				...state,
				selectedMeter: action.meterID
			};
		case ActionType.UpdateDisplayTitle:
			return {
				...state,
				displayTitle: action.displayTitle,
				submitted: false
			};
		case ActionType.UpdateDefaultChartToRender:
			return {
				...state,
				defaultChartToRender: action.defaultChartToRender,
				submitted: false
			};
		case ActionType.ToggleDefaultBarStacking:
			return {
				...state,
				defaultBarStacking: !state.defaultBarStacking,
				submitted: false
			};
		case ActionType.ToggleDefaultAreaNormalization:
			return {
				...state,
				defaultAreaNormalization: !state.defaultAreaNormalization,
				submitted: false
			}
		case ActionType.UpdateDefaultAreaUnit:
			return {
				...state,
				defaultAreaUnit: action.defaultAreaUnit,
				submitted: false
			}
		case ActionType.UpdateDefaultTimeZone:
			return {
				...state,
				defaultTimeZone: action.timeZone,
				submitted: false
			};
		case ActionType.UpdateDefaultLanguage:
			return {
				...state,
				defaultLanguage: action.defaultLanguage,
				submitted: false
			};
		case ActionType.RequestPreferences:
			return {
				...state,
				isFetching: true
			};
		case ActionType.ReceivePreferences:
			return {
				...state,
				isFetching: false,
				displayTitle: action.data.displayTitle,
				defaultChartToRender: action.data.defaultChartToRender,
				defaultBarStacking: action.data.defaultBarStacking,
				defaultLanguage: action.data.defaultLanguage,
				defaultTimeZone: action.data.defaultTimezone,
				defaultWarningFileSize: action.data.defaultWarningFileSize,
				defaultFileSizeLimit: action.data.defaultFileSizeLimit,
				defaultAreaNormalization: action.data.defaultAreaNormalization,
				defaultAreaUnit: action.data.defaultAreaUnit,
				defaultMeterReadingFrequency: durationFormat(action.data.defaultMeterReadingFrequency)
			};
		case ActionType.MarkPreferencesNotSubmitted:
			return {
				...state,
				submitted: false
			};
		case ActionType.MarkPreferencesSubmitted:
			return {
				...state,
				// Convert the duration returned from Postgres into more human format.
				defaultMeterReadingFrequency: durationFormat(action.defaultMeterReadingFrequency),
				submitted: true
			};
		case ActionType.UpdateDefaultWarningFileSize:
			return {
				...state,
				defaultWarningFileSize: action.defaultWarningFileSize,
				submitted: false
			}
		case ActionType.UpdateDefaultFileSizeLimit:
			return {
				...state,
				defaultFileSizeLimit: action.defaultFileSizeLimit,
				submitted: false
			}
		case ActionType.UpdateCikAndDBViews:
			return {
				...state,
				isUpdatingCikAndDBViews: true
			}
		case ActionType.UpdateDefaultMeterReadingFrequency:
			return {
				...state,
				defaultMeterReadingFrequency: action.defaultMeterReadingFrequency,
				submitted: false
			};
		default:
			return state;
	}
}
