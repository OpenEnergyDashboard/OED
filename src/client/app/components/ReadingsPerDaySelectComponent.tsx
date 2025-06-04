/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import { readingsApi, stableEmptyThreeDReadings } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectThreeDQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectReadingsPerDaySelectData } from '../redux/selectors/threeDSelectors';
import { selectThreeDReadingInterval, updateThreeDReadingInterval } from '../redux/slices/graphSlice';
import { ReadingInterval } from '../types/redux/graph';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * A component which allows users to select number of reading per day for 3D graphic
 * @returns A Select menu with Readings per day options.
 */
export default function ReadingsPerDaySelect() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const readingInterval = useAppSelector(selectThreeDReadingInterval);
	const { args, shouldSkipQuery } = useAppSelector(selectThreeDQueryArgs);

	const { currentValue, isDisabled, isFetching } = readingsApi.endpoints.threeD.useQuery(args, {
		skip: shouldSkipQuery,
		selectFromResult: ({ currentData, ...result }) => ({
			...result,
			...selectReadingsPerDaySelectData(currentData ?? stableEmptyThreeDReadings, readingInterval)
		})
	});

	return (
		<div>
			<p style={{ fontWeight: 'bold', margin: 0 }}>
				{`${translate('readings.per.day')}:`}
				<TooltipMarkerComponent page='home' helpTextId={'help.home.readings.per.day'} />
			</p>
			<Select
				value={currentValue}
				options={options}
				isLoading={isFetching}
				isDisabled={isDisabled}
				onChange={e => dispatch(updateThreeDReadingInterval(e!.value))}
			/>
		</div>
	);
}

interface ReadingsPerDayOption {
	label: string;
	value: ReadingInterval;
}

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
		} as ReadingsPerDayOption;
	});

