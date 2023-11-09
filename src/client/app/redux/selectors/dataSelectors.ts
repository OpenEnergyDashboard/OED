import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { selectBarWidthDays, selectComparePeriod, selectCompareTimeInterval, selectGraphState, selectQueryTimeInterval } from '../../reducers/graph';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { calculateCompareShift } from '../../utils/calculateCompare';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { selectBarWidthDays, selectComparePeriod, selectCompareTimeInterval, selectGraphState, selectQueryTimeInterval } from '../../reducers/graph';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { calculateCompareShift } from '../../utils/calculateCompare';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { selectGroupDataById } from '../api/groupsApi';
import { selectMeterDataById } from '../api/metersApi';
import { selectIsLoggedInAsAdmin } from './authSelectors';
import { RootState } from 'store';

// TODO DUPLICATE SELECTOR? UI SELECTOR MAY CONTAIN SAME LOGIC, CONSOLIDATE IF POSSIBLE?
export const selectVisibleMetersGroupsDataByID = createSelector(
	selectMeterDataById,
	selectGroupDataById,
	selectIsLoggedInAsAdmin,
	(meterDataById, groupDataById, isAdmin) => {
		let visibleMeters;
		let visibleGroups;
		if (isAdmin) {
			visibleMeters = meterDataById
			visibleGroups = groupDataById;
		} else {
			visibleMeters = _.filter(meterDataById, meter => meter.displayable);
			visibleGroups = _.filter(groupDataById, group => group.displayable);
		}

		return { visibleMeters, visibleGroups }
	}
)

// query args that 'most' graphs share
export interface commonArgsMultiID {
	ids: number[];
	timeInterval: string;
	unitID: number;
	meterOrGroup: MeterOrGroup;
}
export interface commonArgsSingleID extends Omit<commonArgsMultiID, 'ids'> { id: number }

// endpoint specific args
export interface LineReadingApiArgs extends commonArgsMultiID { }
export interface BarReadingApiArgs extends commonArgsMultiID { barWidthDays: number }

export interface ThreeDReadingApiArgs extends commonArgsSingleID { readingInterval: ReadingInterval }
export interface CompareReadingApiArgs extends Omit<commonArgsMultiID, 'timeInterval'> {
	// compare breaks the timeInterval pattern query pattern therefore omit and add required for api.
	shift: string,
	curr_start: string,
	curr_end: string
}
// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
export interface MapReadingApiArgs extends BarReadingApiArgs { }


export const selectCommonQueryArgs = createSelector(
	selectGraphState,
	graphState => {
		const queryTimeInterval = graphState.queryTimeInterval
		// args that 'most' meters queries share
		const commonMeterArgs: commonArgsMultiID = {
			ids: graphState.selectedMeters,
			timeInterval: queryTimeInterval.toString(),
			unitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.meters
		}

		// args that 'most' groups queries share
		const commonGroupArgs: commonArgsMultiID = {
			ids: graphState.selectedGroups,
			timeInterval: queryTimeInterval.toString(),
			unitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		}

		return { commonMeterArgs, commonGroupArgs }
	}
)

export const selectLineChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	({ commonMeterArgs, commonGroupArgs }) => {
		// props to pass into the line chart component

		const meterArgs: LineReadingApiArgs = commonMeterArgs;
		const groupArgs: LineReadingApiArgs = commonGroupArgs;
		const meterShouldSkip = !commonMeterArgs.ids.length;
		const groupShouldSkip = !commonGroupArgs.ids.length;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectBarChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectBarWidthDays,
	({ commonMeterArgs, commonGroupArgs }, barWidthDays) => {
		// props to pass into the line chart component

		const meterArgs: BarReadingApiArgs = {
			...commonMeterArgs,
			barWidthDays: Math.round(barWidthDays.asDays())

		};
		const groupArgs: BarReadingApiArgs = {
			...commonGroupArgs,
			barWidthDays: Math.round(barWidthDays.asDays())
		};
		const meterShouldSkip = !commonMeterArgs.ids.length;
		const groupShouldSkip = !commonGroupArgs.ids.length;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectCompareChartQueryArgs = createSelector(
	selectCommonQueryArgs,
	selectComparePeriod,
	selectCompareTimeInterval,
	({ commonMeterArgs, commonGroupArgs }, comparePeriod, compareTimeInterval) => {
		const meterArgs: CompareReadingApiArgs = {
			...commonMeterArgs,
			shift: calculateCompareShift(comparePeriod).toISOString(),
			curr_start: compareTimeInterval.getStartTimestamp()?.toISOString(),
			curr_end: compareTimeInterval.getEndTimestamp()?.toISOString()
		}
		const groupArgs: CompareReadingApiArgs = {
			...commonGroupArgs,
			shift: calculateCompareShift(comparePeriod).toISOString(),
			curr_start: compareTimeInterval.getStartTimestamp()?.toISOString(),
			curr_end: compareTimeInterval.getEndTimestamp()?.toISOString()
		}
		const meterShouldSkip = !commonMeterArgs.ids.length;
		const groupShouldSkip = !commonGroupArgs.ids.length;
		return { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip }
	}
)

export const selectMapChartQueryArgs = createSelector(
	selectBarChartQueryArgs,
	selectQueryTimeInterval,
	(state: RootState) => state.maps,
	(barChartArgs, queryTimeInterval, maps) => {

		const meterArgs: MapReadingApiArgs = {
			...barChartArgs.meterArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: Math.round(((queryTimeInterval.equals(TimeInterval.unbounded()))
				? moment.duration(4, 'weeks')
				: moment.duration(queryTimeInterval.duration('days'), 'days')).asDays())
		}
		const groupArgs: MapReadingApiArgs = {
			...barChartArgs.groupArgs,
			// Maps uses the Bar Endpoint so just use its args for simplicity, however barWidthDays should be durationDays
			barWidthDays: Math.round(((queryTimeInterval.equals(TimeInterval.unbounded()))
				? moment.duration(4, 'weeks')
				: moment.duration(queryTimeInterval.duration('days'), 'days')).asDays()
			)
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
	selectGraphState,
	graphState => {
		const queryTimeInterval = graphState.queryTimeInterval
		const args: ThreeDReadingApiArgs = {
			id: graphState.threeD.meterOrGroupID!,
			timeInterval: roundTimeIntervalForFetch(queryTimeInterval).toString(),
			unitID: graphState.selectedUnit,
			readingInterval: graphState.threeD.readingInterval,
			meterOrGroup: graphState.threeD.meterOrGroup!
		}
		const shouldSkipQuery = !graphState.threeD.meterOrGroupID || !queryTimeInterval.getIsBounded()
		return { args, shouldSkipQuery }
	}
)

export const selectChartQueryArgs = createSelector(
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