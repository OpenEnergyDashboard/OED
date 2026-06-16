/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSlice } from '@reduxjs/toolkit';
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
import { TemperatureUnitType } from '../../utils/getTemperatureUnitConversion';

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
	defaultTemperatureUnit: TemperatureUnitType.celsius,
	defaultMeterReadingFrequency: '00:15:00',
	defaultMeterMinimumDate: moment(0).utc().format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterMaximumDate: moment(0).utc().add(5000, 'years').format('YYYY-MM-DD HH:mm:ssZ'),
	defaultMeterReadingGap: 0,
	defaultMeterMaximumErrors: 75,
	defaultHelpUrl: '',
	defaultWeatherLocation: ''
};

export const adminSlice = createSlice({
	name: 'admin',
	initialState: defaultAdminState,
	reducers: {},
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
		defaultTemperatureUnit: adminState.defaultTemperatureUnit,
		defaultMeterReadingFrequency: adminState.defaultMeterReadingFrequency,
		defaultMeterMinimumDate: adminState.defaultMeterMinimumDate,
		defaultMeterMaximumDate: adminState.defaultMeterMaximumDate,
		defaultMeterReadingGap: adminState.defaultMeterReadingGap,
		defaultMeterMaximumErrors: adminState.defaultMeterMaximumErrors,
		defaultHelpUrl: adminState.defaultHelpUrl,
		defaultWeatherLocation: adminState.defaultWeatherLocation
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