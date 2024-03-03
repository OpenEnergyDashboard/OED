/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { utc } from 'moment';
import { ThreeDReading } from 'types/readings';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import {
	selectThreeDMeterOrGroup, selectThreeDMeterOrGroupID
} from '../slices/graphSlice';
import { selectNameFromEntity } from './entitySelectors';


// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	selectThreeDMeterOrGroupID,
	selectThreeDMeterOrGroup,
	selectMeterDataById,
	selectGroupDataById,
	(id, meterOrGroup, meterDataById, groupDataById) => {
		// Default Values
		let meterOrGroupName = '';
		let isAreaCompatible = true;

		if (id && meterDataById[id]) {
			const entity = meterOrGroup === MeterOrGroup.meters ? meterDataById[id] : groupDataById[id];
			meterOrGroupName = selectNameFromEntity(entity);
			// Get Meter or Group's info
			if (meterOrGroup === MeterOrGroup.meters && entity) {
				isAreaCompatible = entity.area !== 0 && entity.areaUnit !== AreaUnitType.none;
			} else if (meterOrGroup === MeterOrGroup.groups && entity) {
				meterOrGroupName = entity.name;
				isAreaCompatible = entity.area !== 0 && entity.areaUnit !== AreaUnitType.none;
			}
		}
		return {
			meterOrGroupID: id,
			meterOrGroup: meterOrGroup,
			meterOrGroupName: meterOrGroupName,
			isAreaCompatible: isAreaCompatible
		};
	}
);


export const selectReadingsPerDaySelectData = createSelector(
	[
		(readings: ThreeDReading) => readings,
		(_readings: ThreeDReading, readingInterval: ReadingInterval) => readingInterval
	],
	(data, readingInterval) => {
		// initially honor the selected reading interval.
		let actualReadingInterval = readingInterval;
		if (data && data.zData.length) {
			// Special Case:  When no compatible data available, data returned is from api is -999
			if (data.zData[0][0] && data.zData[0][0] < 0) {
				actualReadingInterval = ReadingInterval.Incompatible;
			} else {
				const startTS = utc(data.xData[0].startTimestamp);
				const endTS = utc(data.xData[0].endTimestamp);
				// This should be the number of hours between readings.
				actualReadingInterval = endTS.diff(startTS) / 3600000;
			}
		}
		// Default Display Value && Disabled Status
		let displayValue = `${24 / readingInterval}`;
		let isDisabled = false;

		// Modify Display Value if needed.
		if (actualReadingInterval === ReadingInterval.Incompatible) {
			// Disable select when api returns  -999 incompatible
			isDisabled = true;
		} else if (actualReadingInterval !== readingInterval) {
			// notify user with converted 'syntax'
			displayValue += ` -> ${24 / actualReadingInterval}`;
		}

		// Current Value to be displayed on ReadingsPerDay component.
		const currentValue = {
			label: displayValue,
			value: readingInterval
		};
		return { actualReadingInterval, isDisabled, displayValue,  currentValue };
	}
);
