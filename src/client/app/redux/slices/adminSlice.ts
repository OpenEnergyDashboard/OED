/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as moment from 'moment';
import { createAppSelector } from '../../redux/selectors/selectors';
import { PreferenceRequestItem } from '../../types/items';
import { AdminState } from '../../types/redux/admin';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { durationFormat } from '../../utils/durationFormat';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { preferencesApi } from '../api/preferencesApi';
import { selectOEDVersion } from '../../redux/api/versionApi';

export const defaultAdminState: AdminState = {
	displayTitle: '',
	defaultChartToRender: ChartTypes.line,
	defaultBarStacking: false,
	defaultTimezone: '',
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
	defaultMeterDisableChecks: false,
	defaultHelpUrl: ''
};

export const adminSlice = createSlice({
	name: 'admin',
	initialState: defaultAdminState,
	reducers: {
		updateDisplayTitle: (state, action: PayloadAction<string>) => {
			state.displayTitle = action.payload;
			state.submitted = false;
		},
		updateDefaultChartToRender: (state, action: PayloadAction<ChartTypes>) => {
			state.defaultChartToRender = action.payload;
			state.submitted = false;
		},
		toggleDefaultBarStacking: state => {
			state.defaultBarStacking = !state.defaultBarStacking;
			state.submitted = false;
		},
		toggleDefaultAreaNormalization: state => {
			state.defaultAreaNormalization = !state.defaultAreaNormalization;
			state.submitted = false;
		},
		updateDefaultAreaUnit: (state, action: PayloadAction<AreaUnitType>) => {
			state.defaultAreaUnit = action.payload;
			state.submitted = false;
		},
		updateDefaultTimezone: (state, action: PayloadAction<string>) => {
			state.defaultTimezone = action.payload;
			state.submitted = false;
		},
		updateDefaultLanguage: (state, action: PayloadAction<LanguageTypes>) => {
			state.defaultLanguage = action.payload;
			state.submitted = false;
		},
		requestPreferences: state => {
			state.isFetching = true;
		},
		receivePreferences: (state, action: PayloadAction<PreferenceRequestItem>) => {
			state = {
				...state,
				isFetching: false,
				...action.payload,
				defaultMeterReadingFrequency: durationFormat(action.payload.defaultMeterReadingFrequency)
			};
		},
		markPreferencesNotSubmitted: state => {
			state.submitted = false;
		},
		markPreferencesSubmitted: (state, action: PayloadAction<string>) => {
			state.defaultMeterReadingFrequency = durationFormat(action.payload);
			state.submitted = true;
		},
		updateDefaultWarningFileSize: (state, action: PayloadAction<number>) => {
			state.defaultWarningFileSize = action.payload;
			state.submitted = false;
		},
		updateDefaultFileSizeLimit: (state, action: PayloadAction<number>) => {
			state.defaultFileSizeLimit = action.payload;
			state.submitted = false;
		},
		toggleWaitForCikAndDB: state => {
			state.isUpdatingCikAndDBViews = !state.isUpdatingCikAndDBViews;
		},
		updateDefaultMeterReadingFrequency: (state, action: PayloadAction<string>) => {
			state.defaultMeterReadingFrequency = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterMinimumValue: (state, action: PayloadAction<number>) => {
			state.defaultMeterMinimumValue = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterMaximumValue: (state, action: PayloadAction<number>) => {
			state.defaultMeterMaximumValue = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterMinimumDate: (state, action: PayloadAction<string>) => {
			state.defaultMeterMinimumDate = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterMaximumDate: (state, action: PayloadAction<string>) => {
			state.defaultMeterMaximumDate = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterReadingGap: (state, action: PayloadAction<number>) => {
			state.defaultMeterReadingGap = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterMaximumErrors: (state, action: PayloadAction<number>) => {
			state.defaultMeterMaximumErrors = action.payload;
			state.submitted = false;
		},
		updateDefaultMeterDisableChecks: (state, action: PayloadAction<boolean>) => {
			state.defaultMeterDisableChecks = action.payload;
			state.submitted = false;
		},
		updateDefaultHelpUrl: (state, action: PayloadAction<string>) => {
			state.defaultHelpUrl = action.payload;
			state.submitted = false;
		}
	},
	extraReducers: builder => {
		builder.addMatcher(preferencesApi.endpoints.getPreferences.matchFulfilled, (state, action) => ({
			...state,
			...action.payload,
			defaultMeterReadingFrequency: durationFormat(action.payload.defaultMeterReadingFrequency)
		}));
	},
	selectors: {
		selectAdminState: state => state,
		selectDisplayTitle: state => state.displayTitle,
		selectBaseHelpUrl: state => state.defaultHelpUrl
	}
});

export const {
	updateDisplayTitle,
	updateDefaultChartToRender,
	updateDefaultLanguage,
	updateDefaultTimezone,
	updateDefaultWarningFileSize,
	updateDefaultFileSizeLimit,
	updateDefaultAreaUnit,
	updateDefaultMeterReadingFrequency,
	updateDefaultMeterMinimumValue,
	updateDefaultMeterMaximumValue,
	updateDefaultMeterMinimumDate,
	updateDefaultMeterMaximumDate,
	updateDefaultMeterReadingGap,
	updateDefaultMeterMaximumErrors,
	updateDefaultMeterDisableChecks
} = adminSlice.actions;

export const {
	selectAdminState,
	selectDisplayTitle,
	selectBaseHelpUrl
} = adminSlice.selectors;


export const selectAdminPreferences = createAppSelector(
	[selectAdminState],
	(adminState): PreferenceRequestItem => ({
		displayTitle: adminState.displayTitle,
		defaultChartToRender: adminState.defaultChartToRender,
		defaultBarStacking: adminState.defaultBarStacking,
		defaultLanguage: adminState.defaultLanguage,
		defaultTimezone: adminState.defaultTimezone,
		defaultWarningFileSize: adminState.defaultWarningFileSize,
		defaultFileSizeLimit: adminState.defaultFileSizeLimit,
		defaultAreaNormalization: adminState.defaultAreaNormalization,
		defaultAreaUnit: adminState.defaultAreaUnit,
		defaultMeterReadingFrequency: adminState.defaultMeterReadingFrequency,
		defaultMeterMinimumValue: adminState.defaultMeterMinimumValue,
		defaultMeterMaximumValue: adminState.defaultMeterMaximumValue,
		defaultMeterMinimumDate: adminState.defaultMeterMinimumDate,
		defaultMeterMaximumDate: adminState.defaultMeterMaximumDate,
		defaultMeterReadingGap: adminState.defaultMeterReadingGap,
		defaultMeterMaximumErrors: adminState.defaultMeterMaximumErrors,
		defaultMeterDisableChecks: adminState.defaultMeterDisableChecks,
		defaultHelpUrl: adminState.defaultHelpUrl
	})
);

export const selectHelpUrl = createAppSelector(
	[selectBaseHelpUrl, selectOEDVersion],
	(baseHelpUrl, version) => {
		// The web pages, including help/documentation use _ not . in version.
		//  It also uses V not v and has help at the start.
		const helpVersion = 'help' + version.replaceAll('.', '_').replace('v', 'V');
		const helpUrl = baseHelpUrl + helpVersion;
		return helpUrl;
	}
);