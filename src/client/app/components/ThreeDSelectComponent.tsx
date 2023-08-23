/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { ChartTypes, ReadingsPerDay } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { updateThreeDReadingsPerDay } from '../actions/graph';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns Chart data select element
 */
export default function ThreeDSelectComponent() {
	const dispatch: Dispatch = useDispatch();
	const graphState = useSelector((state: State) => state.graph);
	const readingsPerDay = useSelector((state: State) => state.graph.threeD.readingsPerDay);
	// Iterate over ReadingsPerDay enum to create select option
	const options = Object.values(ReadingsPerDay)
		// Filter strings as to only get integer values from typescript's reverse mapping of enums
		.filter(value => !isNaN(Number(value)))
		.map(value => {
			// Length of interval readings in hours
			const intervalLength = Number(value);
			return {
				// ReadingsPerDay Enum inversely corresponds to the hour interval for readings.
				// (24 hours a day) / intervalLength, e.g, 1 hour intervals give 24 readings per day
				label: String((24 / intervalLength)),
				value: intervalLength
			} as ReadingsPerDayOption
		});

	// Value currently being rendered
	// Use the selectedOption as an enum key to update threeD State
	const onSelectChange = (selectedOption: ReadingsPerDayOption) => dispatch(updateThreeDReadingsPerDay(selectedOption.value));

	const value = { label: String(24 / readingsPerDay), value: readingsPerDay };
	if (graphState.chartToRender === ChartTypes.threeD) {
		return (
			<div>
				<p style={{ fontWeight: 'bold', margin: 0 }}>
					{`${translate('readings.per.day')}:`}
					<TooltipMarkerComponent page='home' helpTextId={translate('readings.per.day')} />
				</p>
				<Select value={value} options={options} onChange={onSelectChange} />
			</div>
		)
	} else {
		return null;
	}
}

interface ReadingsPerDayOption {
	label: string;
	value: ReadingsPerDay;
}