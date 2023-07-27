/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import PreferencesComponent from '../../components/admin/PreferencesComponent';
import {
	updateDisplayTitle,
	updateDefaultChartToRender,
	toggleDefaultBarStacking,
	updateTimeZone,
	updateDefaultLanguage,
	submitPreferencesIfNeeded,
	updateDefaultWarningFileSize,
	updateDefaultFileSizeLimit,
	toggleDefaultAreaNormalization,
	updateDefaultAreaUnit,
	updateDefaultMeterReadingFrequency,
	// TODO : ADD CONDSET VALUES (MINVAL, MAXVAL, READING GAP, MINDATE, MAXDATE, )
	updateDefaultMeterMinimumValue,
	updateDefaultMeterMaximumValue,
	updateDefaultMeterMinimumDate,
	updateDefaultMeterMaximumDate,
	updateDefaultMeterReadingGap,
	updateDefaultMeterMaximumErrors
} from '../../actions/admin';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';

function mapStateToProps(state: State) {
	return {
		displayTitle: state.admin.displayTitle,
		defaultChartToRender: state.admin.defaultChartToRender,
		defaultTimeZone: state.admin.defaultTimeZone,
		defaultBarStacking: state.admin.defaultBarStacking,
		defaultLanguage: state.admin.defaultLanguage,
		disableSubmitPreferences: state.admin.submitted,
		defaultWarningFileSize: state.admin.defaultWarningFileSize,
		defaultFileSizeLimit: state.admin.defaultFileSizeLimit,
		defaultAreaNormalization: state.admin.defaultAreaNormalization,
		defaultAreaUnit: state.admin.defaultAreaUnit,
		defaultMeterReadingFrequency: state.admin.defaultMeterReadingFrequency,
		// TODO : ADD CONDSET VALUES (MINVAL, MAXVAL, READING GAP, MINDATE, MAXDATE, )
		defaultMeterMinimumValue: state.admin.defaultMeterMinimumValue,
		defaultMeterMaximumValue: state.admin.defaultMeterMaximumValue,
		defaultMeterMinimumDate: state.admin.defaultMeterMinimumDate,
		defaultMeterMaximumDate: state.admin.defaultMeterMaximumDate,
		defaultMeterReadingGap: state.admin.defaultMeterReadingGap,
		defaultMeterMaximumErrors: state.admin.defaultMeterMaximumErrors
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateDisplayTitle: (displayTitle: string) => dispatch(updateDisplayTitle(displayTitle)),
		updateDefaultChartType: (defaultChartToRender: ChartTypes) => dispatch(updateDefaultChartToRender(defaultChartToRender)),
		updateDefaultTimeZone: (timeZone: string) => dispatch(updateTimeZone(timeZone)),
		toggleDefaultBarStacking: () => dispatch(toggleDefaultBarStacking()),
		updateDefaultLanguage: (defaultLanguage: LanguageTypes) => dispatch(updateDefaultLanguage(defaultLanguage)),
		submitPreferences: () => dispatch(submitPreferencesIfNeeded()),
		updateDefaultWarningFileSize: (defaultWarningFileSize: number) => dispatch(updateDefaultWarningFileSize(defaultWarningFileSize)),
		updateDefaultFileSizeLimit: (defaultFileSizeLimit: number) => dispatch(updateDefaultFileSizeLimit(defaultFileSizeLimit)),
		toggleDefaultAreaNormalization: () => dispatch(toggleDefaultAreaNormalization()),
		updateDefaultAreaUnit: (defaultAreaUnit: AreaUnitType) => dispatch(updateDefaultAreaUnit(defaultAreaUnit)),
		updateDefaultMeterReadingFrequency: (defaultMeterReadingFrequency: string) =>
			dispatch(updateDefaultMeterReadingFrequency(defaultMeterReadingFrequency)),
		
		updateDefaultMeterMinimumValue: (defaultMeterMinimumValue: number) => dispatch(updateDefaultMeterMinimumValue(defaultMeterMinimumValue)),
		updateDefaultMeterMaximumValue: (defaultMeterMaximumValue: number) => dispatch(updateDefaultMeterMaximumValue(defaultMeterMaximumValue)),
		updateDefaultMeterMinimumDate: (defaultMeterMinimumDate: string) => dispatch(updateDefaultMeterMinimumDate(defaultMeterMinimumDate)),
		updateDefaultMeterMaximumDate: (defaultMeterMaximumDate: string) => dispatch(updateDefaultMeterMaximumDate(defaultMeterMaximumDate)),
		updateDefaultMeterMaximumErrors: (defaultMeterMaximumErrors: number) => dispatch(updateDefaultMeterMaximumErrors(defaultMeterMaximumErrors)),
		updateDefaultMeterReadingGap: (defaultMeterReadingGap: number) => dispatch(updateDefaultMeterReadingGap(defaultMeterReadingGap))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(PreferencesComponent);
