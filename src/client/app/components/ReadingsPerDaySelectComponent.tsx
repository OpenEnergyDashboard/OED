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
import { ByMeterOrGroup, MeterOrGroup } from '../types/redux/graph';
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
import * as moment from 'moment';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns A Select menu with Readings per day options.
 */
export default function ReadingsPerDaySelect() {
	const dispatch: Dispatch = useDispatch();
	const graphState = useSelector((state: State) => state.graph);
	const readingInterval = useSelector((state: State) => state.graph.threeD.readingInterval);
	const actualInterval = useSelector((state: State) => {
		const threeDState = state.graph.threeD;
		const meterOrGroupID = threeDState.meterOrGroupID;
		// meterOrGroup determines whether to get readings from state .byMeterID or .byGroupID
		const byMeterOrGroup = threeDState.meterOrGroup === MeterOrGroup.meters ? ByMeterOrGroup.meters : ByMeterOrGroup.groups;
		// 3D requires intervals to be rounded to a full day.
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();
		const unitID = state.graph.selectedUnit;
		// Level of detail along the xAxis / Readings per day
		const readingInterval = state.graph.threeD.readingInterval;

		// If Meter doesn't exist return null, else return whether data exists or not.
		const data = !meterOrGroupID ? null : state.readings.threeD[byMeterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[readingInterval]?.readings;
		if (data && data.zData.length) {
			const startTS = moment.utc(data.xData[0].startTimestamp);
			const endTS = moment.utc(data.xData[0].endTimestamp);
			const actualReadingInterval = endTS.diff(startTS) / 3600000;
			// Special Cases, no compatible data available, or data was 'mucked' with to
			if (data.zData[0][0] && data.zData[0][0] < 0) {
				// Calculate the actual time interval based on the xlabel values
				// This value may differ from expected readings per day due to incompatible meter reading frequencies
				return -999;
			} else if (readingInterval !== actualReadingInterval) {
				return actualReadingInterval
			}
		}

		//Assume Hourly intervals if no data yet.
		return null;
	})

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
	// Default Display Value && Disabled Status
	let displayValue = `${24 / readingInterval}`;
	let isDisabled = false;

	// Modify Display Value if needed.
	if (actualInterval && actualInterval > readingInterval) {
		displayValue += ` -> ${24 / actualInterval}`
	} else if (actualInterval && actualInterval < 0) {
		displayValue = ''
		isDisabled = true;
	}

	const value = {
		label: displayValue,
		value: readingInterval
	}

	if (graphState.chartToRender === ChartTypes.threeD) {
		return (
			<div>
				<p style={{ fontWeight: 'bold', margin: 0 }}>
					{`${translate('readings.per.day')}:`}
					<TooltipMarkerComponent page='home' helpTextId={'help.home.readings.per.day'} />
				</p>
				<Select value={value} options={options} isDisabled={isDisabled} onChange={onSelectChange} />
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
