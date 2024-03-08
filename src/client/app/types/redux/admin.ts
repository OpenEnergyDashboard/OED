/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ChartTypes } from './graph';
import { LanguageTypes } from './i18n';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';


export interface AdminState {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultTimezone: string;
	defaultLanguage: LanguageTypes;
	isFetching: boolean;
	submitted: boolean;
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
	isUpdatingCikAndDBViews: boolean;
	defaultAreaNormalization: boolean;
	defaultAreaUnit: AreaUnitType;
	defaultMeterReadingFrequency: string;
	defaultMeterMinimumValue: number;
	defaultMeterMaximumValue: number;
	defaultMeterMinimumDate: string;
	defaultMeterMaximumDate: string;
	defaultMeterReadingGap: number;
	defaultMeterMaximumErrors: number;
	defaultMeterDisableChecks: boolean;
	defaultHelpUrl: string;
}
