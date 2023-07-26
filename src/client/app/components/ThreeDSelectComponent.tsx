/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import Select from 'react-select';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { ChartTypes, ThreeDReadingPrecision } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { updateThreeDPrecision } from '../actions/graph';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns Chart data select element
 */
export default function ThreeDSelectComponent() {
	const dispatch: Dispatch = useDispatch();
	const chartToRender = useSelector((state: State) => state.graph.chartToRender);
	const xAxisPrecision = useSelector((state: State) => state.graph.threeD.xAxisPrecision);
	// Iterate over ThreeDReadingPrecision enum to create select option
	// Filter is required due to Typescript 'reverse mapping' of numeric Enums
	const options: PrecisionSelectOption[] = Object.keys(ThreeDReadingPrecision)
		.filter(key => isNaN(Number(key)))
		.map(key => ({
			label: key,
			value: ThreeDReadingPrecision[key as keyof typeof ThreeDReadingPrecision]
		}));

	// Value currently being rendered
	const value = { label: ThreeDReadingPrecision[xAxisPrecision], value: xAxisPrecision }

	// Use the selectedOption as an enum key to update threeD State
	const onSelectChange = (selectedOption: PrecisionSelectOption) => dispatch(updateThreeDPrecision(selectedOption.value));

	console.log(ThreeDReadingPrecision[xAxisPrecision]);
	if (chartToRender === ChartTypes.threeD) {
		return (
			<div>
				<p style={{ fontWeight: 'bold', margin: 0 }}>Select Precision</p>
				<Select value={value} options={options} onChange={onSelectChange} />
				<TooltipMarkerComponent page='home' helpTextId={translate('select.dateRange')} />
			</div>
		)
	} else {
		return null;
	}
}

interface PrecisionSelectOption {
	label: string;
	value: ThreeDReadingPrecision;
}