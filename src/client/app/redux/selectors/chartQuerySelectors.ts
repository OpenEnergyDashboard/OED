import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import * as moment from 'moment';
import { RootState } from 'store';
import { TimeInterval } from '../../../../common/TimeInterval';
import {
	selectBarWidthDays, selectComparePeriod,
	selectCompareTimeInterval, selectQueryTimeInterval,
	selectSelectedGroups, selectSelectedMeters,
	selectSelectedUnit, selectThreeDState
} from '../../reducers/graph';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { calculateCompareShift } from '../../utils/calculateCompare';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';

// query args that 'most' graphs share
export interface commonQueryArgs {
	ids: number[];
	timeInterval: string;
	graphicUnitId: number;
	meterOrGroup: MeterOrGroup;
}

// endpoint specific args
export interface LineReadingApiArgs extends commonQueryArgs { }
export interface BarReadingApiArgs extends commonQueryArgs { barWidthDays: number }

export interface ThreeDReadingApiArgs extends Omit<commonQueryArgs, 'ids'> { id: number, readingInterval: ReadingInterval }
export interface CompareReadingApiArgs extends Omit<commonQueryArgs, 'timeInterval'> {
	// compare breaks the timeInterval pattern query pattern therefore omit and add required for api.
	shift: string,
	curr_start: string,
	curr_end: string
}
// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
export interface MapReadingApiArgs extends BarReadingApiArgs { }


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
		}

		// args that 'most' groups queries share
		const groupArgs = {
			ids: selectedGroups,
			timeInterval: queryTimeInterval.toString(),
			graphicUnitId: selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		}
		const meterSkip = !meterArgs.ids.length;
		const groupSkip = !groupArgs.ids.length;

		return { meterArgs, groupArgs, meterSkip, groupSkip }
	}
)

export const selectLineChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	common => {
		// Args to pass into the line chart component
		const meterArgs: LineReadingApiArgs = common.meterArgs;
		const groupArgs: LineReadingApiArgs = common.groupArgs;
		const meterShouldSkip = common.meterSkip;
		const groupShouldSkip = common.groupSkip;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectBarChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectBarWidthDays,
	(common, barWidthDays) => {
		// QueryArguments to pass into the bar chart component
		const barWidthAsDays = Math.round(barWidthDays.asDays())
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
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectCompareChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectComparePeriod,
	selectCompareTimeInterval,
	(common, comparePeriod, compareTimeInterval) => {
		const compareArgs = {
			shift: calculateCompareShift(comparePeriod).toISOString(),
			curr_start: compareTimeInterval.getStartTimestamp()?.toISOString(),
			curr_end: compareTimeInterval.getEndTimestamp()?.toISOString()
		}
		const meterArgs: CompareReadingApiArgs = {
			..._.omit(common.meterArgs, 'timeInterval'),
			...compareArgs

		}
		const groupArgs: CompareReadingApiArgs = {
			..._.omit(common.groupArgs, 'timeInterval'),
			...compareArgs
		}
		const meterShouldSkip = common.meterSkip;
		const groupShouldSkip = common.groupSkip;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectMapChartQueryArgs = createSelector(
	selectBarChartQueryArgs,
	selectQueryTimeInterval,
	(state: RootState) => state.maps,
	(barChartArgs, queryTimeInterval, maps) => {
		const durationDays = Math.round((
			queryTimeInterval.equals(TimeInterval.unbounded())
				? moment.duration(4, 'weeks')
				: moment.duration(queryTimeInterval.duration('days'), 'days')
		).asDays())

		const meterArgs: MapReadingApiArgs = {
			...barChartArgs.meterArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: durationDays
		}
		const groupArgs: MapReadingApiArgs = {
			...barChartArgs.groupArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: durationDays

		}
		const meterShouldSkip = barChartArgs.meterShouldSkip || maps.selectedMap === 0
		const groupShouldSkip = barChartArgs.groupShouldSkip || maps.selectedMap === 0
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}

)


// Selector prepares the query args for ALL graph endpoints based on the current graph slice state
// TODO Break down into individual selectors?
// Verify if prop drilling is a better pattern vs useSelector in same sameComponent
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
		}
		const shouldSkipQuery = !threeD.meterOrGroupID || !queryTimeInterval.getIsBounded()
		return { args, shouldSkipQuery }
	}
)

export const selectAllChartQueryArgs = createSelector(
	selectLineChartQueryArgs,
	selectBarChartQueryArgs,
	selectCompareChartQueryArgs,
	selectMapChartQueryArgs,
	selectThreeDQueryArgs,
	(line, bar, compare, map, threeD) => ({
		line,
		bar,
		compare,
		map,
		threeD
	})
)