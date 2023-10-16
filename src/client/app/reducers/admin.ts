/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ChartTypes } from '../types/redux/graph';
import { ActionType } from '../types/redux/actions';
import { AdminState, AdminAction } from '../types/redux/admin';
import { LanguageTypes } from '../types/redux/i18n';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { durationFormat } from '../utils/durationFormat';
import * as moment from 'moment';

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
	defaultMeterReadingFrequency: '00:15:00',
	defaultMeterMinimumValue: Number.MIN_SAFE_INTEGER,
	defaultMeterMaximumValue: Number.MAX_SAFE_INTEGER,
	defaultMeterMinimumDate: moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterMaximumDate: moment(0).utc().add(5000, 'years').format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterReadingGap: 0,
	defaultMeterMaximumErrors: 75,
	defaultMeterDisableChecks: false
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
				defaultMeterReadingFrequency: durationFormat(action.data.defaultMeterReadingFrequency),
				defaultMeterMinimumValue: action.data.defaultMeterMinimumValue,
				defaultMeterMaximumValue: action.data.defaultMeterMaximumValue,
				defaultMeterMinimumDate: action.data.defaultMeterMinimumDate,
				defaultMeterMaximumDate: action.data.defaultMeterMaximumDate,
				defaultMeterReadingGap: action.data.defaultMeterReadingGap,
				defaultMeterMaximumErrors: action.data.defaultMeterMaximumErrors,
				defaultMeterDisableChecks: action.data.defaultMeterDisableChecks
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
		case ActionType.ToggleWaitForCikAndDB:
			return {
				...state,
				isUpdatingCikAndDBViews: !state.isUpdatingCikAndDBViews
			}
		case ActionType.UpdateDefaultMeterReadingFrequency:
			return {
				...state,
				defaultMeterReadingFrequency: action.defaultMeterReadingFrequency,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterMinimumValue:
			return {
				...state,
				defaultMeterMinimumValue: action.defaultMeterMinimumValue,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterMaximumValue:
			return {
				...state,
				defaultMeterMaximumValue: action.defaultMeterMaximumValue,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterMinimumDate:
			return {
				...state,
				defaultMeterMinimumDate: action.defaultMeterMinimumDate,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterMaximumDate:
			return {
				...state,
				defaultMeterMaximumDate: action.defaultMeterMaximumDate,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterReadingGap:
			return {
				...state,
				defaultMeterReadingGap: action.defaultMeterReadingGap,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterMaximumErrors:
			return {
				...state,
				defaultMeterMaximumErrors: action.defaultMeterMaximumErrors,
				submitted: false
			}
		case ActionType.UpdateDefaultMeterDisableChecks:
			return {
				...state,
				defaultMeterDisableChecks: action.defaultMeterDisableChecks,
				submitted: false
			}
		default:
			return state;
	}
}
