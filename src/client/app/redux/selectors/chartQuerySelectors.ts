/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { calculateCompareShift } from '../../utils/calculateCompare';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import {
	selectWidthDays, selectComparePeriod,
	selectCompareTimeInterval, selectQueryTimeInterval,
	selectSelectedGroups, selectSelectedMeters,
	selectSelectedUnit, selectThreeDState,
	selectShiftAmount
} from '../slices/graphSlice';
import { omit } from 'lodash';
import { selectLineChartDeps } from './lineChartSelectors';

// query args that 'most' graphs share
export interface commonQueryArgs {
	ids: number[];
	timeInterval: string;
	graphicUnitId: number;
	meterOrGroup: MeterOrGroup;
}

// endpoint specific args
export interface LineReadingApiArgs extends commonQueryArgs { }
export interface CompareLineReadingApiArgs extends commonQueryArgs { }
export interface BarReadingApiArgs extends commonQueryArgs { barWidthDays: number }

// ThreeD only queries a single id so extend common, but omit ids array
export interface ThreeDReadingApiArgs extends Omit<commonQueryArgs, 'ids'> { id: number, readingInterval: ReadingInterval }
export interface CompareReadingApiArgs extends Omit<commonQueryArgs, 'timeInterval'> {
	// compare breaks the timeInterval pattern query pattern therefore omit and add required for api.
	shift: string,
	curr_start: string,
	curr_end: string
}
// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
export interface MapReadingApiArgs extends BarReadingApiArgs { }
export interface RadarReadingApiArgs extends commonQueryArgs { }

export const selectCommonQueryArgs = createSelector(
	selectSelectedMeters,
	selectSelectedGroups,
	selectQueryTimeInterval,
	selectSelectedUnit,
	(selectedMeters, selectedGroups, queryTimeInterval, selectedUnit) => {
		// args that 'most' meters queries share
		const meterArgs = {
			ids: selectedMeters,
			timeInterval: queryTimeInterval.toString(),
			graphicUnitId: selectedUnit,
			meterOrGroup: MeterOrGroup.meters
		};

		// args that 'most' groups queries share
		const groupArgs = {
			ids: selectedGroups,
			timeInterval: queryTimeInterval.toString(),
			graphicUnitId: selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		};
		// skip fetch if no meters or groups selected respectively
		const meterSkip = !meterArgs.ids.length;
		const groupSkip = !groupArgs.ids.length;

		// Most Queries share these arguments, however values can be appended, or omitted per endpoint specification
		return { meterArgs, groupArgs, meterSkip, groupSkip };
	}
);

export const selectLineChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	common => {
		// Use the commonQuery args to populate the args to pass into the line chart component
		const meterArgs: LineReadingApiArgs = common.meterArgs;
		const groupArgs: LineReadingApiArgs = common.groupArgs;
		const meterShouldSkip = common.meterSkip;
		const groupShouldSkip = common.groupSkip;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip };
	}
);

export const selectCompareLineQueryArgs = createSelector(
	selectQueryTimeInterval,
	selectSelectedUnit,
	selectThreeDState,
	selectLineChartDeps,
	selectShiftAmount,
	(queryTimeInterval, selectedUnit, threeD, lineChartDeps, ShiftAmount) => {
		const args: CompareLineReadingApiArgs =
			threeD.meterOrGroup === MeterOrGroup.meters
				? {
					ids: [threeD.meterOrGroupID!],
					timeInterval: queryTimeInterval.toString(),
					graphicUnitId: selectedUnit,
					meterOrGroup: threeD.meterOrGroup!
				}
				: {
					ids: [threeD.meterOrGroupID!],
					timeInterval: queryTimeInterval.toString(),
					graphicUnitId: selectedUnit,
					meterOrGroup: threeD.meterOrGroup!
				};
		const shouldSkipQuery = !threeD.meterOrGroupID || !queryTimeInterval.getIsBounded() || ShiftAmount == 'none';
		const argsDeps = threeD.meterOrGroup === MeterOrGroup.meters ? lineChartDeps.meterDeps : lineChartDeps.groupDeps;
		return { args, shouldSkipQuery, argsDeps };
	}
);

export const selectRadarChartQueryArgs = createSelector(
	selectLineChartQueryArgs,
	lineChartArgs => {
		// Radar uses the same args as line, so copy
		return { ...lineChartArgs };
	}
);

export const selectBarChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectWidthDays,
	(common, barWidthDays) => {
		// QueryArguments to pass into the bar chart component
		const barWidthAsDays = Math.round(barWidthDays.asDays());
		// copy common args, then add bar chart args
		const meterArgs: BarReadingApiArgs = {
			...common.meterArgs,
			barWidthDays: barWidthAsDays
		};
		const groupArgs: BarReadingApiArgs = {
			...common.groupArgs,
			barWidthDays: barWidthAsDays
		};
		const meterShouldSkip = common.meterSkip;
		const groupShouldSkip = common.groupSkip;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip };
	}
);

export const selectCompareChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectComparePeriod,
	selectCompareTimeInterval,
	(common, comparePeriod, compareTimeInterval) => {
		const compareArgs = {
			shift: calculateCompareShift(comparePeriod).toISOString(),
			curr_start: compareTimeInterval.getStartTimestamp()?.toISOString(),
			curr_end: compareTimeInterval.getEndTimestamp()?.toISOString()
		};
		const meterArgs: CompareReadingApiArgs = {
			// compare currently doesn't use the global time interval, so omit
			...omit(common.meterArgs, 'timeInterval'),
			...compareArgs

		};
		const groupArgs: CompareReadingApiArgs = {
			// compare currently doesn't use the global time interval, so omit
			...omit(common.groupArgs, 'timeInterval'),
			...compareArgs
		};
		const meterShouldSkip = common.meterSkip;
		const groupShouldSkip = common.groupSkip;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip };
	}
);

export const selectMapChartQueryArgs = createSelector(
	selectBarChartQueryArgs,
	selectWidthDays,
	(state: RootState) => state.maps,
	(barChartArgs, barWidthDays, maps) => {
		const durationDays = Math.round(barWidthDays.asDays());

		const meterArgs: MapReadingApiArgs = {
			...barChartArgs.meterArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: durationDays
		};
		const groupArgs: MapReadingApiArgs = {
			...barChartArgs.groupArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: durationDays

		};
		const meterShouldSkip = barChartArgs.meterShouldSkip || maps.selectedMap === 0;
		const groupShouldSkip = barChartArgs.groupShouldSkip || maps.selectedMap === 0;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip };
	}

);

export const selectThreeDQueryArgs = createSelector(
	selectQueryTimeInterval,
	selectSelectedUnit,
	selectThreeDState,
	(queryTimeInterval, selectedUnit, threeD) => {
		const args: ThreeDReadingApiArgs = {
			id: threeD.meterOrGroupID!,
			timeInterval: roundTimeIntervalForFetch(queryTimeInterval).toString(),
			graphicUnitId: selectedUnit,
			readingInterval: threeD.readingInterval,
			meterOrGroup: threeD.meterOrGroup!
		};
		const shouldSkipQuery = !threeD.meterOrGroupID || !queryTimeInterval.getIsBounded();
		return { args, shouldSkipQuery };
	}
);

export const selectAllChartQueryArgs = createSelector(
	selectLineChartQueryArgs,
	selectBarChartQueryArgs,
	selectCompareChartQueryArgs,
	selectMapChartQueryArgs,
	selectThreeDQueryArgs,
	selectCompareLineQueryArgs,
	(line, bar, compare, map, threeD, compareLine) => ({
		line,
		bar,
		compare,
		map,
		threeD,
		compareLine
	})
);
