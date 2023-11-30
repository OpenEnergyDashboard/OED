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
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatibility';
import * as moment from 'moment';

/**
 * A component which allows users to select number of reading per day for the graphic
 * @returns A Select menu with Readings per day options.
 */
export default function ReadingsPerDaySelect() {
	const dispatch: Dispatch = useDispatch();
	const graphState = useSelector((state: State) => state.graph);
	// Level of detail along the xAxis / Readings per day
	const readingInterval = useSelector((state: State) => state.graph.threeD.readingInterval);
	// This makes sure that the time between graphic values is not less than the time between readings.
	const actualReadingInterval = useSelector((state: State) => {
		const threeDState = state.graph.threeD;
		const meterOrGroupID = threeDState.meterOrGroupID;
		// meterOrGroup determines whether to get readings from state .byMeterID or .byGroupID
		const byMeterOrGroup = threeDState.meterOrGroup === MeterOrGroup.meters ? ByMeterOrGroup.meters : ByMeterOrGroup.groups;
		// 3D requires intervals to be rounded to a full day.
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();
		const unitID = state.graph.selectedUnit;

		// If meter or group not selected return null data, else return data if any.
		const data = !meterOrGroupID ? null : state.readings.threeD[byMeterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[readingInterval]?.readings;

		if (data && data.zData.length) {
			// Special Case:  When no compatible data available, data returned is from api is -999
			if (data.zData[0][0] && data.zData[0][0] < 0) {
				return ReadingInterval.Incompatible;
			}

			// Calculate the actual time interval based on the xLabel values
			const startTS = moment.utc(data.xData[0].startTimestamp);
			const endTS = moment.utc(data.xData[0].endTimestamp);
			// This should be the number of hours between readings.
			const actualReadingInterval = endTS.diff(startTS) / 3600000;
			return actualReadingInterval
		}

		// Return normal interval
		return readingInterval;
	})

	// Iterate over readingInterval enum to create select option
	const options = Object.values(ReadingInterval)
		// Filter strings as to only get integer values from typescript's reverse mapping of enums
		.filter(value => !isNaN(Number(value)) && value !== ReadingInterval.Incompatible)
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

	// Use the selectedOption enum value to update threeD State
	const onSelectChange = (selectedOption: ReadingsPerDayOption) => dispatch(updateThreeDReadingInterval(selectedOption.value));

	// Default Display Value && Disabled Status
	let displayValue = `${24 / readingInterval}`;
	let isDisabled = false;

	// Modify Display Value if needed.
	if (actualReadingInterval === ReadingInterval.Incompatible) {
		isDisabled = true;
	} else if (actualReadingInterval !== readingInterval) {
		displayValue += ` -> ${24 / actualReadingInterval}`;
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
