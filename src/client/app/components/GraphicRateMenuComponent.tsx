/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectSelectedUnitData } from '../redux/selectors/plotlyDataSelectors';
import { graphSlice, selectGraphState } from '../redux/slices/graphSlice';
import { SelectOption } from '../types/items';
import { ChartTypes, LineGraphRate, LineGraphRates } from '../types/redux/graph';
import { UnitRepresentType } from '../types/redux/units';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * React component that controls the line graph rate menu
 * @returns Rate selection element
 */
export default function GraphicRateMenuComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();

	// Graph state
	const graphState = useAppSelector(selectGraphState);

	// Unit data by Id
	const selectedUnitData = useAppSelector(selectSelectedUnitData);

	// Should the rate drop down menu be rendered.
	let shouldRender = true;
	// Compare the value of name to be 'kW' or 'kWh' or unitRepresent type to be 'raw' and update the visibility of the Rate menu
	if (selectedUnitData) {
		const { name, unitRepresent } = selectedUnitData;
		if (unitRepresent === UnitRepresentType.raw || name === 'kW' || name === 'kWh') {
			shouldRender = false;
		}
	}
	// Also don't show if not the line graphic, or three-d.
	const displayOnChartType: ChartTypes[] = [
		ChartTypes.line,
		ChartTypes.threeD,
		ChartTypes.radar
	];

	if (!displayOnChartType.includes(graphState.chartToRender)) {
		shouldRender = false;
	}
	// Array of select options created from the rates
	const rateOptions: SelectOption[] = [];

	//Loop over our rates object to create the selects for the dropdown
	Object.entries(LineGraphRates).forEach(([rateKey, rateValue]) => {
		rateOptions.push({
			label: translate(rateKey),
			value: rateValue,
			labelIdForTranslate: rateKey
		} as SelectOption);
	});

	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};

	return (
		<div>
			{
				shouldRender &&
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='rate' />:
						<TooltipMarkerComponent page='home' helpTextId='help.home.select.rates' />
					</p>
					{ /* On change update the line graph rate in the store after a null check */}
					<Select
						options={rateOptions}
						value={{ label: translate(graphState.lineGraphRate.label), value: graphState.lineGraphRate.rate } as SelectOption}
						onChange={newSelectedRate => {
							if (newSelectedRate) {
								dispatch(graphSlice.actions.updateLineGraphRate({
									label: newSelectedRate.labelIdForTranslate,
									rate: Number(newSelectedRate.value)
								} as LineGraphRate));
							}
						}}
					/>
				</div>
			}
		</div>
	);
}
