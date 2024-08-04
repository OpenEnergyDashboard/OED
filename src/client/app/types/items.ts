/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ChartTypes, MeterOrGroup } from '../types/redux/graph';
import { LanguageTypes } from './redux/i18n';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { MeterData } from './redux/meters';
import { GroupData } from './redux/groups';
import { UnitData } from './redux/units';

/**
 * The type of options displayed in Select components.
 */
export interface SelectOption {
	label: string;
	value: number;
	isDisabled?: boolean;
	labelIdForTranslate?: string;
	style?: React.CSSProperties;
	meterOrGroup?: MeterOrGroup;
	defaultGraphicUnit?: number;
	entity?: MeterData | GroupData | UnitData;
}
export interface GroupedOption {
	label: string;
	options: SelectOption[];
}

/**
 * SelectOption but holds strings
 */
export interface StringSelectOption {
	label: string;
	value: string;
}

/**
 * An item with a name and ID number.
 */
export interface NamedIDItem {
	id: number;
	name: string;
}

/**
 * An item that is the result of a preference request
 */
export interface PreferenceRequestItem {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultLanguage: LanguageTypes;
	defaultTimezone: string;
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
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

/**
 * A collection of items giving a label to an item in a dataset, by index
 */
export interface TooltipItems {
	datasetIndex: number;
	yLabel: string;
	[i: number]: {
		xLabel: string;
	};
}

/**
 * A user object to be displayed for Administrators.
 */
export interface User {
	id?: number;
	username: string;
	role: UserRole;
	password?: string;
	note: string;
}

/**
 * The values of this enum that needs to match the keys of User.role in src/server/models/User
 */
export enum UserRole {
	INVALID = 'invalid',
	ADMIN = 'admin',
	CSV = 'csv',
	EXPORT = 'export',
	OBVIUS = 'obvius'
}

export enum TrueFalseType {
	// Normally the values here are not used but the ones in data.js so translated.
	true = 'yes',
	false = 'no'
}

// user default values
export const userDefaults = {
	username: '',
	password: '',
	confirmPassword: '',
	note: '',
	role: UserRole.INVALID,
	passwordMatch: true,
	disableDelete: false,
	passwordLength: true
};