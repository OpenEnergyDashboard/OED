/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { ChartTypes, ReadingInterval } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { updateThreeDReadingInterval } from '../actions/graph';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns A Select menu with Readings per day options.
 */
export default function ReadingsPerDaySelect() {
	const dispatch: Dispatch = useDispatch();
	const graphState = useSelector((state: State) => state.graph);
	const readingInterval = useSelector((state: State) => state.graph.threeD.readingInterval);
	// Iterate over readingInterval enum to create select option
	const options = Object.values(ReadingInterval)
		// Filter strings as to only get integer values from typescript's reverse mapping of enums
		.filter(value => !isNaN(Number(value)))
		.map(value => {
			// Length of interval readings in hours
			const intervalLength = Number(value);
			return {
				// readingInterval Enum inversely corresponds to the hour interval for readings.
				// (24 hours a day) / intervalLength, e.g, 1 hour intervals give 24 readings per day
				label: String((24 / intervalLength)),
				value: intervalLength
			} as ReadingsPerDayOption
		});

	// Value currently being rendered
	// Use the selectedOption as an enum key to update threeD State
	const onSelectChange = (selectedOption: ReadingsPerDayOption) => dispatch(updateThreeDReadingInterval(selectedOption.value));

	const value = { label: String(24 / readingInterval), value: readingInterval };
	if (graphState.chartToRender === ChartTypes.threeD) {
		return (
			<div>
				<p style={{ fontWeight: 'bold', margin: 0 }}>
					{`${translate('readings.per.day')}:`}
					<TooltipMarkerComponent page='home' helpTextId={'help.home.readings.per.day'} />
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
	value: ReadingInterval;
}
