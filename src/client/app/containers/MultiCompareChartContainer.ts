/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MultiCompareChartComponent from '../components/MultiCompareChartComponent';
import { State } from '../types/redux/state';
import {calculateCompareDuration, ComparePeriod, SortingOrder} from '../utils/calculateCompare';
import { TimeInterval } from '../../../common/TimeInterval';
import * as moment from 'moment';

export interface CompareEntity {
	id: number;
	isGroup: boolean;
	name: string;
	change: number;
	lastPeriodTotalUsage: number;
	currentPeriodUsage: number;
	usedToThisPointLastTimePeriod: number;
}

interface ReadingsData {
	isFetching: boolean;
	readings?: Array<[number, number]>;
}

function mapStateToProps(state: State) {
	const meters: CompareEntity[] = getDataForIDs(state.graph.selectedMeters, false, state);
	const groups: CompareEntity[] = getDataForIDs(state.graph.selectedGroups, true, state);
	const compareEntities: CompareEntity[] = meters.concat(groups);
	const sortingOrder = state.graph.compareSortingOrder;
	return {
		selectedCompareEntities: sortIDs(compareEntities, sortingOrder)
	};
}

function getDataForIDs(ids: number[], isGroup: boolean, state: State): CompareEntity[] {
	const timeInterval = state.graph.compareTimeInterval;
	const comparePeriod = state.graph.comparePeriod;
	const barDuration = calculateCompareDuration(comparePeriod);
	const entities: CompareEntity[] = [];
	for (const id of ids) {
		let name: string;
		let readingsData: ReadingsData | undefined;
		if (isGroup) {
			name = getGroupName(state, id);
			readingsData = getGroupReadingsData(state, id, timeInterval, barDuration);
		} else {
			name = getMeterName(state, id);
			readingsData = getMeterReadingsData(state, id, timeInterval, barDuration);
		}
		if (isReadingsDataValid(readingsData)) {
			const timeSincePeriodStart = getTimeSincePeriodStart(comparePeriod);
			if (readingsData!.readings!.length < timeSincePeriodStart) {
				throw new Error(`Insufficient readings data to process comparison for id ${id}, ti ${timeInterval}, dur ${barDuration}.
				readingsData has ${readingsData!.readings!.length} but we'd like to look at the last ${timeSincePeriodStart} elements.`);
			}
			const currentPeriodUsage = calculateCurrentPeriodUsage(readingsData!, timeSincePeriodStart) || 0;
			const lastPeriodTotalUsage = calculateLastPeriodUsage(readingsData!, timeSincePeriodStart) || 0;
			const usedToThisPointLastTimePeriod = calculateUsageToThisPointLastTimePeroid(readingsData!, timeSincePeriodStart) || 0;
			const change = calculateChange(currentPeriodUsage, usedToThisPointLastTimePeriod, lastPeriodTotalUsage);
			const entity: CompareEntity = {id, isGroup, name, change, lastPeriodTotalUsage, currentPeriodUsage, usedToThisPointLastTimePeriod};
			entities.push(entity);
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

function getGroupReadingsData(state: State, groupID: number, timeInterval: TimeInterval, barDuration: moment.Duration): ReadingsData | undefined {
	let readingsData: ReadingsData | undefined ;
	const readingsDataByID = state.readings.bar.byGroupID[groupID];
	const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
	readingsData = readingsDataByTimeInterval[barDuration.toISOString()];
	return readingsData;
}

function getMeterReadingsData(state: State, meterID: number, timeInterval: TimeInterval, barDuration: moment.Duration): ReadingsData | undefined {
	let readingsData: ReadingsData | undefined ;
	const readingsDataByID = state.readings.bar.byMeterID[meterID];
	const readingsDataByTimeInterval = readingsDataByID[timeInterval.toString()];
	readingsData = readingsDataByTimeInterval[barDuration.toISOString()];
	return readingsData;
}

function getTimeSincePeriodStart(comparePeriod: ComparePeriod): number {
	let timeSincePeriodStart;
	switch (comparePeriod) {
		case ComparePeriod.Day:
			timeSincePeriodStart = moment().hour();
			break;
		case ComparePeriod.Week:
			timeSincePeriodStart = moment().diff(moment().startOf('week'), 'days');
			break;
		case ComparePeriod.FourWeeks:
			// 21 to differentiate from Week case, Week case never larger than 14
			timeSincePeriodStart = moment().diff(moment().startOf('week').subtract(21, 'days'), 'days');
			break;
		default:
			throw new Error(`Unknown period value: ${comparePeriod}`);
	}
	return timeSincePeriodStart;
}

function calculateCurrentPeriodUsage(readingsData: ReadingsData, timeSincePeriodStart: number): number {
	let currentPeriodUsage = 0;
	for (let i = readingsData.readings!.length - timeSincePeriodStart; i < readingsData.readings!.length; i++) {
		currentPeriodUsage += readingsData.readings![i][1];
	}
	return currentPeriodUsage;
}

function calculateLastPeriodUsage(readingsData: ReadingsData, timeSincePeriodStart: number): number {
	let lastPeriodTotalUsage = 0;
	for (let i = 0; i < readingsData.readings!.length - timeSincePeriodStart; i++) {
		lastPeriodTotalUsage += readingsData.readings![i][1];
	}
	return lastPeriodTotalUsage;
}

function calculateUsageToThisPointLastTimePeroid(readingsData: ReadingsData, timeSincePeriodStart: number): number {
	// Have to special case Sunday for Week and FourWeeks
	let usedToThisPointLastTimePeriod = 0;
	if (timeSincePeriodStart === 0) {
		usedToThisPointLastTimePeriod = Math.round((readingsData.readings![0][1] / 24) * moment().hour());
	} else {
		for (let i = 0; i < timeSincePeriodStart; i++) {
			usedToThisPointLastTimePeriod += readingsData.readings![i][1];
		}
	}
	return usedToThisPointLastTimePeriod;
}

function isReadingsDataValid(readingsData: ReadingsData | undefined): boolean {
	return readingsData !== undefined && !readingsData.isFetching && readingsData.readings !== undefined;
}

function calculateChange(currentPeriodUsage: number, usedToThisPointLastTimePeriod: number, lastPeriodTotalUsage: number): number {
	return (-1 + (((currentPeriodUsage / usedToThisPointLastTimePeriod) * lastPeriodTotalUsage) / lastPeriodTotalUsage));
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
		case SortingOrder.Descending:
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
		case SortingOrder.Ascending:
			ids.sort((a, b) =>  {
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
