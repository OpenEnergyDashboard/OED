/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectTemperatureUnit, graphSlice } from '../redux/slices/graphSlice';
import { TemperatureUnitType } from '../types/redux/graph';
import { useTranslate } from '../redux/componentHooks';
import { StringSelectOption } from '../types/items';

/**
 * React Component that creates the temperature unit selector dropdown
 * @returns temperature unit select element
 */
export default function TemperatureUnitSelectComponent() {
	const dispatch = useAppDispatch();
	const translate = useTranslate();
	const temperatureUnit = useAppSelector(selectTemperatureUnit);

	// Array of select options created from the temperatureUnitType enum
	const temperatureUnitOptions: StringSelectOption[] = [];

	Object.keys(TemperatureUnitType).forEach(unitKey => {
		temperatureUnitOptions.push({
			label: translate(`TemperatureUnitType.${unitKey}`),
			value: unitKey
		} as StringSelectOption);
	});

	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};

	return (
		<div>
			<p style={{ fontWeight: 'bold', margin: 0 }}>
				<FormattedMessage id='temperature.unit' />
				<TooltipMarkerComponent page='home' helpTextId='help.home.temperature.unit' />
			</p>
			<div style={divBottomPadding}>
				<Select
					value={{ label: translate(`TemperatureUnitType.${temperatureUnit}`), value: temperatureUnit } as StringSelectOption}
					options={temperatureUnitOptions}
					onChange={newSelectedUnit => {
						if (newSelectedUnit) {
							dispatch(graphSlice.actions.updateSelectedTemperatureUnit(newSelectedUnit.value as TemperatureUnitType));
						}
					}}
				/>
			</div>
		</div>
	);
}
