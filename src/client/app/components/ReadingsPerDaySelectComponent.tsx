/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import Select from 'react-select';
import { selectGraphState, selectThreeDReadingInterval, updateThreeDReadingInterval } from '../reducers/graph';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectThreeDQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { ChartTypes, ReadingInterval } from '../types/redux/graph';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * A component which allows users to select date ranges for the graphic
 * @returns A Select menu with Readings per day options.
 */
export default function ReadingsPerDaySelect() {
	const dispatch = useAppDispatch();
	const graphState = useAppSelector(selectGraphState);
	const readingInterval = useAppSelector(selectThreeDReadingInterval);
	const { args, shouldSkipQuery } = useAppSelector(selectThreeDQueryArgs);

	const { data, isFetching } = readingsApi.endpoints.threeD.useQuery(args, { skip: shouldSkipQuery });

	let actualReadingInterval = ReadingInterval.Hourly
	if (data && data.zData.length) {
		// Special Case:  When no compatible data available, data returned is from api is -999
		if (data.zData[0][0] && data.zData[0][0] < 0) {
			actualReadingInterval = ReadingInterval.Incompatible;
		} else {
			const startTS = moment.utc(data.xData[0].startTimestamp);
			const endTS = moment.utc(data.xData[0].endTimestamp);
			actualReadingInterval = endTS.diff(startTS) / 3600000;
		}

	}

	// Return normal interval
	// return readingInterval;

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
				<Select value={value} options={options} isLoading={isFetching} isDisabled={isDisabled} onChange={onSelectChange} />
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
