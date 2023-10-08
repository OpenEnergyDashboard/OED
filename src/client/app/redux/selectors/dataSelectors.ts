import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { ThreeDReadingApiParams } from '../../redux/api/readingsApi';
import { RootState } from '../../store';
import { MeterOrGroup } from '../../types/redux/graph';
import { GroupDefinition } from '../../types/redux/groups';
import { MeterData } from '../../types/redux/meters';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { selectIsLoggedInAsAdmin } from './authSelectors';


export const selectMeterDataByID = (state: RootState) => state.meters.byMeterID;
export const selectGroupDataByID = (state: RootState) => state.groups.byGroupID;
export const selectUnitDataById = (state: RootState) => state.units.units;

export const selectMeterState = (state: RootState) => state.meters;
export const selectGroupState = (state: RootState) => state.groups;
export const selectUnitState = (state: RootState) => state.units;
export const selectMapState = (state: RootState) => state.maps;
export const selectThreeDState = (state: RootState) => state.graph.threeD;
export const selectBarWidthDays = (state: RootState) => state.graph.barDuration;
export const selectGraphState = (state: RootState) => state.graph;

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
// line/meters/10,11,12?timeInterval=2020-05-02T14:04:36Z_2020-09-08T15:00:00Z&graphicUnitId=1
// bar/meters/21,22,10,18?timeInterval=2020-05-02T14:04:36Z_2020-09-08T15:00:00Z&barWidthDays=28&graphicUnitId=1

export interface ChartQueryArgs<T> {
	meterArgs: T
	groupsArgs: T
}

export interface ChartQueryProps<T> {
	queryProps: ChartQueryArgs<T>
}

export interface commonArgs {
	ids: number[];
	timeInterval: string;
	graphicUnitID: number;
	meterOrGroup: MeterOrGroup;
}

export interface LineReadingApiArgs extends commonArgs { }
export interface BarReadingApiArgs extends commonArgs { barWidthDays: number }

export const selectChartQueryArgs = createSelector(
	selectGraphState,
	graphState => {
		const baseMeterArgs: commonArgs = {
			// Sort the arrays immutably. Sorting the arrays helps with cache hits.
			ids: [...graphState.selectedMeters].sort(),
			timeInterval: graphState.timeInterval.toString(),
			graphicUnitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.meters
		}

		const baseGroupArgs: commonArgs = {
			// Sort the arrays immutably. Sorting the arrays helps with cache hits.
			ids: [...graphState.selectedGroups].sort(),
			timeInterval: graphState.timeInterval.toString(),
			graphicUnitID: graphState.selectedUnit,
			meterOrGroup: MeterOrGroup.groups
		}

		const line: ChartQueryArgs<LineReadingApiArgs> = {
			meterArgs: baseMeterArgs,
			groupsArgs: baseGroupArgs
		}

		const bar: ChartQueryArgs<BarReadingApiArgs> = {
			meterArgs: { ...baseMeterArgs, barWidthDays: Math.round(graphState.barDuration.asDays()) },
			groupsArgs: { ...baseGroupArgs, barWidthDays: Math.round(graphState.barDuration.asDays()) }
		}


		const threeD = {
			args: {
				meterOrGroupID: graphState.threeD.meterOrGroupID,
				timeInterval: roundTimeIntervalForFetch(graphState.timeInterval).toString(),
				unitID: graphState.selectedUnit,
				readingInterval: graphState.threeD.readingInterval,
				meterOrGroup: graphState.threeD.meterOrGroup
			} as ThreeDReadingApiParams,
			skip: !graphState.threeD.meterOrGroupID || !graphState.timeInterval.getIsBounded()
		}

		return { line, bar, threeD }
	}
)

