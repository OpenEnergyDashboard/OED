/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MultiCompareChartComponent from '../components/MultiCompareChartComponent';
import { State } from '../types/redux/state';
import { calculateCompareShift, SortingOrder } from '../utils/calculateCompare';
import { CompareReadingsData } from '../types/redux/compareReadings';
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';

export interface CompareEntity {
	id: number;
	isGroup: boolean;
	name: string;
	change: number;
	currUsage: number;
	prevUsage: number;
	prevTotalUsage?: number;
}

let errorEntities: string[] = [];

function mapStateToProps(state: State) {
	errorEntities = [];
	const meters: CompareEntity[] = getDataForIDs(state.graph.selectedMeters, false, state);
	const groups: CompareEntity[] = getDataForIDs(state.graph.selectedGroups, true, state);
	const compareEntities: CompareEntity[] = meters.concat(groups);
	const sortingOrder = state.graph.compareSortingOrder;
	return {
		selectedCompareEntities: sortIDs(compareEntities, sortingOrder),
		errorEntities: errorEntities as string[]
	};
}

function getDataForIDs(ids: number[], isGroup: boolean, state: State): CompareEntity[] {
	const timeInterval = state.graph.compareTimeInterval;
	const comparePeriod = state.graph.comparePeriod;
	const compareShift = calculateCompareShift(comparePeriod);
	const entities: CompareEntity[] = [];
	for (const id of ids) {
		let name: string;
		let readingsData: CompareReadingsData | undefined;
		if (isGroup) {
			name = getGroupName(state, id);
			readingsData = getGroupReadingsData(state, id, timeInterval, compareShift);
		} else {
			name = getMeterName(state, id);
			readingsData = getMeterReadingsData(state, id, timeInterval, compareShift);
		}
		if (isReadingsDataValid(readingsData)) {
			/* eslint-disable @typescript-eslint/no-non-null-assertion */
			const currUsage = readingsData!.curr_use!;
			const prevUsage = readingsData!.prev_use!;
			const change = calculateChange(currUsage, prevUsage);
			const entity: CompareEntity = { id, isGroup, name, change, currUsage, prevUsage };
			entities.push(entity);
			/* eslint-enable @typescript-eslint/no-non-null-assertion */
		}
	}
	return entities;
}

function getGroupName(state: State, groupID: number): string {
	if (state.groups.byGroupID[groupID] === undefined) {
		return '';
	}
	return state.groups.byGroupID[groupID].name;
}

function getMeterName(state: State, meterID: number): string {
	if (state.meters.byMeterID[meterID] === undefined) {
		return '';
	}
	return state.meters.byMeterID[meterID].name;
}

function getGroupReadingsData(state: State, groupID: number, timeInterval: TimeInterval, compareShift: moment.Duration):
	CompareReadingsData | undefined {
	const unitID = state.graph.selectedUnit;
	let readingsData: CompareReadingsData | undefined;
	const readingsDataByID = state.readings.compare.byGroupID[groupID];
	if (readingsDataByID !== undefined) {
		const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
		if (readingsDataByTimeInterval !== undefined) {
			const readingsDataByCompareShift = readingsDataByTimeInterval[compareShift.toISOString()];
			if (readingsDataByCompareShift !== undefined) {
				const readingsDataByUnitID = readingsDataByCompareShift[unitID];
				if (readingsDataByUnitID !== undefined) {
					readingsData = readingsDataByUnitID;
				}
			}
		}
	}
	return readingsData;
}

function getMeterReadingsData(state: State, meterID: number, timeInterval: TimeInterval, compareShift: moment.Duration):
	CompareReadingsData | undefined {
	const unitID = state.graph.selectedUnit;
	let readingsData: CompareReadingsData | undefined;
	const readingsDataByID = state.readings.compare.byMeterID[meterID];
	if (readingsDataByID !== undefined) {
		const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
		if (readingsDataByTimeInterval !== undefined) {
			const readingsDataByCompareShift = readingsDataByTimeInterval[compareShift.toISOString()];
			if (readingsDataByCompareShift !== undefined) {
				const readingsDataByUnitID = readingsDataByCompareShift[unitID];
				if (readingsDataByUnitID !== undefined) {
					readingsData = readingsDataByUnitID;
				}
			}
		}
	}
	return readingsData;
}

function isReadingsDataValid(readingsData: CompareReadingsData | undefined): boolean {
	return readingsData !== undefined && !readingsData.isFetching && readingsData.curr_use !== undefined && readingsData.prev_use !== undefined;
}

function calculateChange(currentPeriodUsage: number, usedToThisPointLastTimePeriod: number): number {
	return -1 + (currentPeriodUsage / usedToThisPointLastTimePeriod);
}

function sortIDs(ids: CompareEntity[], sortingOrder: SortingOrder): CompareEntity[] {
	switch (sortingOrder) {
		case SortingOrder.Alphabetical:
			ids.sort((a, b) => {
				const nameA = a.name.toLowerCase().trim();
				const nameB = b.name.toLowerCase().trim();
				if (nameA < nameB) {
					return -1;
				}
				if (nameA > nameB) {
					return 1;
				}
				return 0;
			});
			break;
		case SortingOrder.Ascending:
			ids.sort((a, b) => {
				if (a.change < b.change) {
					return -1;
				}
				if (a.change > b.change) {
					return 1;
				}
				return 0;
			});
			break;
		case SortingOrder.Descending:
			ids.sort((a, b) => {
				if (a.change > b.change) {
					return -1;
				}
				if (a.change < b.change) {
					return 1;
				}
				return 0;
			});
			break;
		default:
			throw new Error(`Unknown sorting order: ${sortingOrder}`);
	}
	return ids;
}

export default connect(mapStateToProps)(MultiCompareChartComponent);
