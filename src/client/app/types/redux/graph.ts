/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ComparePeriod, SortingOrder } from '../../utils/calculateCompare';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';

export enum ChartTypes {
	line = 'line',
	bar = 'bar',
	compare = 'compare',
	map = 'map',
	threeD = '3D'
}

// Rates that can be graphed, only relevant to line graphs.
export const LineGraphRates = {
	'second': (1 / 3600),
	'minute': (1 / 60),
	'hour': 1,
	'day': 24
}

// Use to determine readings per day on 3D Graphs
// 24 / ReadingInterval.Hourly(1) = 24 readings per day @ 1 hour intervals
// 24 / ReadingInterval.TwoHour(2) = 12 readings per day @ 2 hour intervals
// and so on.
export enum ReadingInterval {
	Hourly = 1,
	TwoHour = 2,
	ThreeHour = 3,
	FourHour = 4,
	SixHour = 6,
	EightHour = 8,
	TwelveHour = 12,
	Incompatible = -999
}


export interface LineGraphRate {
	label: string,
	rate: number
}

export type MeterOrGroupID = number;
export enum MeterOrGroup { meters = 'meters', groups = 'groups' }
export enum ByMeterOrGroup { meters = 'byMeterID', groups = 'byGroupID' }
export type MeterOrGroupPill = { meterOrGroupID: number, isDisabled: boolean, meterOrGroup: MeterOrGroup }

export interface ThreeDState {
	meterOrGroupID: MeterOrGroupID | undefined;
	meterOrGroup: MeterOrGroup | undefined;
	readingInterval: ReadingInterval;
}

export interface GraphState {
	areaNormalization: boolean;
	selectedMeters: number[];
	selectedGroups: number[];
	selectedUnit: number;
	selectedAreaUnit: AreaUnitType;
	rangeSliderInterval: TimeInterval;
	barDuration: moment.Duration;
	comparePeriod: ComparePeriod;
	compareTimeInterval: TimeInterval;
	compareSortingOrder: SortingOrder;
	chartToRender: ChartTypes;
	barStacking: boolean;
	hotlinked: boolean;
	optionsVisibility: boolean;
	lineGraphRate: LineGraphRate;
	renderOnce: boolean;
	showMinMax: boolean;
	threeD: ThreeDState;
	queryTimeInterval: TimeInterval;
	backHistoryStack: GraphStateHistory[];
	forwardHistoryStack: GraphStateHistory[];
}
export interface GraphStateHistory extends Omit<GraphState, 'backHistoryStack' | 'forwardHistoryStack'> {
}