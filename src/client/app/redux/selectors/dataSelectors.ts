import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { selectGraphState } from '../../reducers/graph';
import { selectGroupDataByID } from '../../reducers/groups';
import { selectMeterDataByID } from '../../reducers/meters';
import { readingsApi } from '../../redux/api/readingsApi';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { GroupDefinition } from '../../types/redux/groups';
import { MeterData } from '../../types/redux/meters';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { selectIsLoggedInAsAdmin } from './authSelectors';

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

// query args that all graphs share
export interface commonArgsMultiID {
	ids: number[];
	timeInterval: string;
	unitID: number;
	meterOrGroup: MeterOrGroup;
}
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
export interface commonArgsSingleID extends Omit<commonArgsMultiID, 'ids'> { id: number }
// endpoint specific args
export interface LineReadingApiArgs extends commonArgsMultiID { }
export interface BarReadingApiArgs extends commonArgsMultiID { barWidthDays: number }
export interface ThreeDReadingApiArgs extends commonArgsSingleID { readingInterval: ReadingInterval; }

// Selector prepares the query args for each endpoint based on the current graph slice state
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
		// TODO; Make 2 types for multi-id and single-id request ARGS
		const threeD: ChartQuerySingleArgs<ThreeDReadingApiArgs> = {
			args: {
				id: graphState.threeD.meterOrGroupID,
				timeInterval: roundTimeIntervalForFetch(graphState.queryTimeInterval).toString(),
				unitID: graphState.selectedUnit,
				readingInterval: graphState.threeD.readingInterval,
				meterOrGroup: graphState.threeD.meterOrGroup
			} as ThreeDReadingApiArgs,
			skipQuery: !graphState.threeD.meterOrGroupID || !graphState.queryTimeInterval.getIsBounded(),
			meta: {
				endpoint: readingsApi.endpoints.threeD.name
			}
		}

		return { line, bar, threeD }
	}
)

export const selectVisibleMetersGroupsDataByID = createSelector(
	selectMeterDataByID,
	selectGroupDataByID,
	selectIsLoggedInAsAdmin,
	(meterDataByID, groupDataByID, isAdmin) => {
		let visibleMeters;
		let visibleGroups;
		if (isAdmin) {
			visibleMeters = meterDataByID
			visibleGroups = groupDataByID;
		} else {
			visibleMeters = _.filter(meterDataByID, (meter: MeterData) => {
				return meter.displayable === true
			});
			visibleGroups = _.filter(groupDataByID, (group: GroupDefinition) => {
				return group.displayable === true
			});
		}

		return { visibleMeters, visibleGroups }
	}
)