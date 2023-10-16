import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { selectGraphState } from '../../reducers/graph';
import { selectGroupDataByID } from '../../reducers/groups';
import { selectMeterDataByID } from '../../reducers/meters';
import { ThreeDReadingApiParams } from '../../redux/api/readingsApi';
import { MeterOrGroup } from '../../types/redux/graph';
import { GroupDefinition } from '../../types/redux/groups';
import { MeterData } from '../../types/redux/meters';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { selectIsLoggedInAsAdmin } from './authSelectors';

// Props that are passed to plotly components
export interface ChartQueryProps<T> {
	queryProps: ChartQueryArgs<T>
}

export interface ChartQueryArgs<T> {
	meterArgs: T
	groupsArgs: T
	meterSkipQuery: boolean
	groupSkipQuery: boolean
}

// query args that all graphs share
export interface commonArgs {
	ids: number[];
	timeInterval: string;
	graphicUnitID: number;
	meterOrGroup: MeterOrGroup;
}
// endpoint specific args
export interface LineReadingApiArgs extends commonArgs { }
export interface BarReadingApiArgs extends commonArgs { barWidthDays: number }

// Selector prepares the query args for each endpoint based on the current graph slice state
export const selectChartQueryArgs = createSelector(
	selectGraphState,
	graphState => {
		// args that all meters queries share
		const baseMeterArgs: commonArgs = {
			ids: graphState.selectedMeters,
			timeInterval: graphState.queryTimeInterval.toString(),
			graphicUnitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.meters
		}

		// args that all groups queries share
		const baseGroupArgs: commonArgs = {
			ids: graphState.selectedGroups,
			timeInterval: graphState.queryTimeInterval.toString(),
			graphicUnitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		}

		// props to pass into the line chart component
		const line: ChartQueryArgs<LineReadingApiArgs> = {
			meterArgs: baseMeterArgs,
			groupsArgs: baseGroupArgs,
			meterSkipQuery: !baseMeterArgs.ids.length,
			groupSkipQuery: !baseGroupArgs.ids.length
		}

		// props to pass into the bar chart component
		const bar: ChartQueryArgs<BarReadingApiArgs> = {
			meterArgs: {
				...baseMeterArgs,
				barWidthDays: Math.round(graphState.barDuration.asDays())
			},
			groupsArgs: {
				...baseGroupArgs,
				barWidthDays: Math.round(graphState.barDuration.asDays())
			},
			meterSkipQuery: !baseMeterArgs.ids.length,
			groupSkipQuery: !baseGroupArgs.ids.length
		}


		const threeD = {
			args: {
				meterOrGroupID: graphState.threeD.meterOrGroupID,
				timeInterval: roundTimeIntervalForFetch(graphState.queryTimeInterval).toString(),
				unitID: graphState.selectedUnit,
				readingInterval: graphState.threeD.readingInterval,
				meterOrGroup: graphState.threeD.meterOrGroup
			} as ThreeDReadingApiParams,
			skip: !graphState.threeD.meterOrGroupID || !graphState.queryTimeInterval.getIsBounded()
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