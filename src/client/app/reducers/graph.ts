/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { GraphState, ChartTypes, ReadingInterval, MeterOrGroup, LineGraphRate } from '../types/redux/graph';
import { calculateCompareTimeInterval, ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	selectedUnit: -99,
	selectedAreaUnit: AreaUnitType.none,
	timeInterval: TimeInterval.unbounded(),
	rangeSliderInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(4, 'weeks'),
	comparePeriod: ComparePeriod.Week,
	compareTimeInterval: calculateCompareTimeInterval(ComparePeriod.Week, moment()),
	compareSortingOrder: SortingOrder.Descending,
	chartToRender: ChartTypes.line,
	barStacking: false,
	areaNormalization: false,
	hotlinked: false,
	optionsVisibility: true,
	lineGraphRate: { label: 'hour', rate: 1 },
	renderOnce: false,
	showMinMax: false,
	threeD: {
		meterOrGroupID: null,
		meterOrGroup: MeterOrGroup.meters,
		readingInterval: ReadingInterval.Hourly
	}
};

export const graphSlice = createSlice({
	name: 'graph',
	initialState: defaultState,
	reducers: {
		confirmGraphRenderOnce: state => {
			state.renderOnce = true
		},
		updateSelectedMeters: (state, action: PayloadAction<number[]>) => {
			state.selectedMeters = action.payload
		},
		updateSelectedGroups: (state, action: PayloadAction<number[]>) => {
			state.selectedGroups = action.payload
		},
		updateSelectedUnit: (state, action: PayloadAction<number>) => {
			state.selectedUnit = action.payload
		},
		updateSelectedAreaUnit: (state, action: PayloadAction<AreaUnitType>) => {
			state.selectedAreaUnit = action.payload
		},
		updateBarDuration: (state, action: PayloadAction<moment.Duration>) => {
			state.barDuration = action.payload
		},
		changeGraphZoom: (state, action: PayloadAction<TimeInterval>) => {
			state.timeInterval = action.payload
		},
		changeSliderRange: (state, action: PayloadAction<TimeInterval>) => {
			state.rangeSliderInterval = action.payload
		},
		resetRangeSliderStack: state => {
			state.rangeSliderInterval = TimeInterval.unbounded()
		},
		updateComparePeriod: (state, action: PayloadAction<{ comparePeriod: ComparePeriod, currentTime: moment.Moment }>) => {
			state.comparePeriod = action.payload.comparePeriod
			state.compareTimeInterval = calculateCompareTimeInterval(action.payload.comparePeriod, action.payload.currentTime)
		},
		changeChartToRender: (state, action: PayloadAction<ChartTypes>) => {
			state.chartToRender = action.payload
		},
		toggleAreaNormalization: state => {
			state.areaNormalization = !state.areaNormalization
		},
		toggleShowMinMax: state => {
			state.showMinMax = !state.showMinMax
		},
		changeBarStacking: state => {
			state.barStacking = !state.barStacking
		},
		setHotlinked: (state, action: PayloadAction<boolean>) => {
			state.hotlinked = action.payload
		},
		changeCompareSortingOrder: (state, action: PayloadAction<SortingOrder>) => {
			state.compareSortingOrder = action.payload
		},
		toggleOptionsVisibility: state => {
			state.optionsVisibility = !state.optionsVisibility
		},
		updateLineGraphRate: (state, action: PayloadAction<LineGraphRate>) => {
			state.lineGraphRate = action.payload
		},

		updateThreeDReadingInterval: (state, action: PayloadAction<ReadingInterval>) => {
			state.threeD.readingInterval = action.payload
		},
		updateThreeDMeterOrGroupInfo: (state, action: PayloadAction<{ meterOrGroupID: number | null, meterOrGroup: MeterOrGroup }>) => {
			state.threeD.meterOrGroupID = action.payload.meterOrGroupID
			state.threeD.meterOrGroup = action.payload.meterOrGroup
		}
	}
})
