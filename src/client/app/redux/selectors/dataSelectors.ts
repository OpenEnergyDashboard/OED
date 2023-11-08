import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { selectGraphState } from '../../reducers/graph';
import { selectGroupDataById } from '../api/groupsApi';
import { selectMeterDataById } from '../api/metersApi';
import { readingsApi } from '../api/readingsApi';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { selectIsLoggedInAsAdmin } from './authSelectors';
import { calculateCompareShift } from '../../utils/calculateCompare';

// Props that are passed to plotly components
export interface ChartMultiQueryProps<T> {
	queryArgs: ChartMultiQueryArgs<T>
}

export interface ChartMultiQueryArgs<T> {
	meterArgs: T
	groupsArgs: T
	meterSkipQuery: boolean
	groupSkipQuery: boolean
	meta: ChartQueryArgsMeta
}

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
// { meterIDs: number[], timeInterval: TimeInterval, shift: moment.Duration, unitID: number }
export interface ChartSingleQueryProps<T> {
	queryArgs: ChartQuerySingleArgs<T>
}

export interface ChartQuerySingleArgs<T> {
	args: T;
	skipQuery: boolean;
	meta: ChartQueryArgsMeta
}
export interface ChartQueryArgsMeta {
	endpoint: string;
}

// Selector prepares the query args for ALL graph endpoints based on the current graph slice state
// TODO Break down into individual selectors? Verify if prop drilling is required
export const selectChartQueryArgs = createSelector(
	selectGraphState,
	graphState => {
		// args that all meters queries share
		const baseMeterArgs: commonArgsMultiID = {
			ids: graphState.selectedMeters,
			timeInterval: graphState.queryTimeInterval.toString(),
			unitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.meters
		}

		// args that all groups queries share
		const baseGroupArgs: commonArgsMultiID = {
			ids: graphState.selectedGroups,
			timeInterval: graphState.queryTimeInterval.toString(),
			unitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		}

		// props to pass into the line chart component
		const line: ChartMultiQueryArgs<LineReadingApiArgs> = {
			meterArgs: baseMeterArgs,
			groupsArgs: baseGroupArgs,
			meterSkipQuery: !baseMeterArgs.ids.length,
			groupSkipQuery: !baseGroupArgs.ids.length,
			meta: {
				endpoint: readingsApi.endpoints.line.name
			}
		}

		// props to pass into the bar chart component
		const bar: ChartMultiQueryArgs<BarReadingApiArgs> = {
			meterArgs: {
				...baseMeterArgs,
				barWidthDays: Math.round(graphState.barDuration.asDays())
			},
			groupsArgs: {
				...baseGroupArgs,
				barWidthDays: Math.round(graphState.barDuration.asDays())
			},
			meterSkipQuery: !baseMeterArgs.ids.length,
			groupSkipQuery: !baseGroupArgs.ids.length,
			meta: {
				endpoint: readingsApi.endpoints.bar.name
			}
		}
		// TODO; Make 2 types for multi-id and single-id request ARGS not idea, but works for now.
		const threeD: ChartQuerySingleArgs<ThreeDReadingApiArgs> = {
			// Fix not null assertion(s)
			args: {
				id: graphState.threeD.meterOrGroupID!,
				timeInterval: roundTimeIntervalForFetch(graphState.queryTimeInterval).toString(),
				unitID: graphState.selectedUnit,
				readingInterval: graphState.threeD.readingInterval,
				meterOrGroup: graphState.threeD.meterOrGroup!
			},
			skipQuery: !graphState.threeD.meterOrGroupID || !graphState.queryTimeInterval.getIsBounded(),
			meta: {
				endpoint: readingsApi.endpoints.threeD.name
			}
		}

		const compare: ChartMultiQueryArgs<CompareReadingApiArgs> = {
			meterArgs: {
				...baseMeterArgs,
				shift: calculateCompareShift(graphState.comparePeriod).toISOString(),
				curr_start: graphState.compareTimeInterval.getStartTimestamp()?.toISOString(),
				curr_end: graphState.compareTimeInterval.getEndTimestamp()?.toISOString()
			},
			groupsArgs: {
				...baseGroupArgs,
				shift: calculateCompareShift(graphState.comparePeriod).toISOString(),
				curr_start: graphState.compareTimeInterval.getStartTimestamp()?.toISOString(),
				curr_end: graphState.compareTimeInterval.getEndTimestamp()?.toISOString()
			},
			meterSkipQuery: !baseMeterArgs.ids.length,
			groupSkipQuery: !baseGroupArgs.ids.length,
			meta: {
				endpoint: readingsApi.endpoints.compare.name
			}
		}

		return { line, bar, threeD, compare }
	}
)

// TODO DUPLICATE SELECTOR? UI SELECTOR MAY CONTAIN SAME LOGIC, CONSOLIDATE IF POSSIBLE?
export const selectVisibleMetersGroupsDataByID = createSelector(
	selectMeterDataById,
	selectGroupDataById,
	selectIsLoggedInAsAdmin,
	({ data: meterDataByID = {} }, { data: groupDataByID = {} }, isAdmin) => {
		let visibleMeters;
		let visibleGroups;
		if (isAdmin) {
			visibleMeters = meterDataByID
			visibleGroups = groupDataByID;
		} else {
			visibleMeters = _.filter(meterDataByID, meter => meter.displayable);
			visibleGroups = _.filter(groupDataByID, group => group.displayable);
		}

		return { visibleMeters, visibleGroups }
	}
)