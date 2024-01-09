/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import PreferencesComponent from '../../components/admin/PreferencesComponent';
import { submitPreferencesIfNeeded } from '../../actions/admin';
import { State } from '../../types/redux/state';
import { Dispatch } from '../../types/redux/actions';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { adminSlice } from '../../reducers/admin';

function mapStateToProps(state: State) {
	return {
		displayTitle: state.admin.displayTitle,
		defaultChartToRender: state.admin.defaultChartToRender,
		defaultTimeZone: state.admin.defaultTimezone,
		defaultBarStacking: state.admin.defaultBarStacking,
		defaultLanguage: state.admin.defaultLanguage,
		disableSubmitPreferences: state.admin.submitted,
		defaultWarningFileSize: state.admin.defaultWarningFileSize,
		defaultFileSizeLimit: state.admin.defaultFileSizeLimit,
		defaultAreaNormalization: state.admin.defaultAreaNormalization,
		defaultAreaUnit: state.admin.defaultAreaUnit,
		defaultMeterReadingFrequency: state.admin.defaultMeterReadingFrequency,
		defaultMeterMinimumValue: state.admin.defaultMeterMinimumValue,
		defaultMeterMaximumValue: state.admin.defaultMeterMaximumValue,
		defaultMeterMinimumDate: state.admin.defaultMeterMinimumDate,
		defaultMeterMaximumDate: state.admin.defaultMeterMaximumDate,
		defaultMeterReadingGap: state.admin.defaultMeterReadingGap,
		defaultMeterMaximumErrors: state.admin.defaultMeterMaximumErrors,
		defaultMeterDisableChecks: state.admin.defaultMeterDisableChecks,
		defaultHelpUrl: state.admin.defaultHelpUrl
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateDisplayTitle: (displayTitle: string) => dispatch(adminSlice.actions.updateDisplayTitle(displayTitle)),

		updateDefaultChartType: (defaultChartToRender: ChartTypes) => dispatch(adminSlice.actions.updateDefaultChartToRender(defaultChartToRender)),

		updateDefaultTimeZone: (timeZone: string) => dispatch(adminSlice.actions.updateDefaultTimeZone(timeZone)),

		toggleDefaultBarStacking: () => dispatch(adminSlice.actions.toggleDefaultBarStacking()),

		updateDefaultLanguage: (defaultLanguage: LanguageTypes) => dispatch(adminSlice.actions.updateDefaultLanguage(defaultLanguage)),

		submitPreferences: () => dispatch(submitPreferencesIfNeeded()),

		updateDefaultWarningFileSize: (defaultWarningFileSize: number) => dispatch(adminSlice.actions.updateDefaultWarningFileSize(defaultWarningFileSize)),

		updateDefaultFileSizeLimit: (defaultFileSizeLimit: number) => dispatch(adminSlice.actions.updateDefaultFileSizeLimit(defaultFileSizeLimit)),

		toggleDefaultAreaNormalization: () => dispatch(adminSlice.actions.toggleDefaultAreaNormalization()),

		updateDefaultAreaUnit: (defaultAreaUnit: AreaUnitType) => dispatch(adminSlice.actions.updateDefaultAreaUnit(defaultAreaUnit)),

		updateDefaultMeterReadingFrequency: (defaultMeterReadingFrequency: string) =>
			dispatch(adminSlice.actions.updateDefaultMeterReadingFrequency(defaultMeterReadingFrequency)),

		updateDefaultMeterMinimumValue: (defaultMeterMinimumValue: number) =>
			dispatch(adminSlice.actions.updateDefaultMeterMinimumValue(defaultMeterMinimumValue)),

		updateDefaultMeterMaximumValue: (defaultMeterMaximumValue: number) =>
			dispatch(adminSlice.actions.updateDefaultMeterMaximumValue(defaultMeterMaximumValue)),

		updateDefaultMeterMinimumDate: (defaultMeterMinimumDate: string) =>
			dispatch(adminSlice.actions.updateDefaultMeterMinimumDate(defaultMeterMinimumDate)),

		updateDefaultMeterMaximumDate: (defaultMeterMaximumDate: string) =>
			dispatch(adminSlice.actions.updateDefaultMeterMaximumDate(defaultMeterMaximumDate)),

		updateDefaultMeterReadingGap: (defaultMeterReadingGap: number) =>
			dispatch(adminSlice.actions.updateDefaultMeterReadingGap(defaultMeterReadingGap)),

		updateDefaultMeterMaximumErrors: (defaultMeterMaximumErrors: number) =>
			dispatch(adminSlice.actions.updateDefaultMeterMaximumErrors(defaultMeterMaximumErrors)),

		updateDefaultMeterDisableChecks: (defaultMeterDisableChecks: boolean) =>
			dispatch(adminSlice.actions.updateDefaultMeterDisableChecks(defaultMeterDisableChecks)),

		updateDefaultHelpUrl: (defaultHelpUrl: string) =>
			dispatch(adminSlice.actions.updateDefaultHelpUrl(defaultHelpUrl))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(PreferencesComponent);
