/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';
import { GraphState, ChartTypes, ReadingInterval, MeterOrGroup, LineGraphRate } from '../types/redux/graph';
import { calculateCompareTimeInterval, ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { adminSlice } from './admin';
import { ActionMeta } from 'react-select';
import { SelectOption } from '../types/items';

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
		meterOrGroupID: undefined,
		meterOrGroup: undefined,
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
		updateThreeDMeterOrGroupInfo: (state, action: PayloadAction<{ meterOrGroupID: number | undefined, meterOrGroup: MeterOrGroup }>) => {
			state.threeD.meterOrGroupID = action.payload.meterOrGroupID
			state.threeD.meterOrGroup = action.payload.meterOrGroup
		},
		updateSelectedMetersFromSelect: (state, action: PayloadAction<{ newMetersOrGroups: number[], meta: ActionMeta<SelectOption> }>) => {
			// Destructure payload
			const { newMetersOrGroups, meta } = action.payload;

			// Used to check if value has been added or removed
			const addedMeterOrGroupID = meta.option?.value;
			const addedMeterOrGroup = meta.option?.meterOrGroup;

			const removedMeterOrGroupID = meta.removedValue?.value;
			const removedMeterOrGroup = meta.removedValue?.meterOrGroup;
			const clearedMeterOrGroups = meta.removedValues;
			console.log('METAAAAAAAAAAA', meta)

			// If no meters selected, and no area unit, we should update unit to default graphic unit
			// const shouldUpdateUnit = !state.selectedGroups.length && !state.selectedMeters.length && state.selectedUnit === -99
			// If meterMeter added then and should update unit, update unit.
			// TODO graphic unit is currently snuck into the select option, find an alternative pattern
			// state.selectedUnit = addedMeterOrGroupID && !shouldUpdateUnit ? state.selectedUnit : meta.

			// TODO SELECT bug in reducer
			// Determine If meter or group was modified then update appropriately
			const meterOrGroup = addedMeterOrGroup ? addedMeterOrGroup : removedMeterOrGroup;
			if (clearedMeterOrGroups) {
				const isAMeter = clearedMeterOrGroups[0].meterOrGroup === MeterOrGroup.meters
				isAMeter ?
					state.selectedMeters = []
					:
					state.selectedGroups = []
			} else if (meterOrGroup && meterOrGroup === MeterOrGroup.meters) {
				state.selectedMeters = newMetersOrGroups
			} else {
				state.selectedGroups = newMetersOrGroups
			}

			// When a meter or group is selected/added, make it the currently active in 3D state.
			if (addedMeterOrGroupID && addedMeterOrGroup && state.chartToRender === ChartTypes.threeD) {
				// TODO Currently only tracks when on 3d, Verify that this is the desired behavior
				state.threeD.meterOrGroupID = addedMeterOrGroupID;
				state.threeD.meterOrGroup = addedMeterOrGroup;
				addedMeterOrGroup === MeterOrGroup.meters ?
					state.selectedMeters = newMetersOrGroups
					:
					state.selectedGroups = newMetersOrGroups
			}

			// Reset Currently Selected 3D Meter Or Group if it has been removed from any page
			if (
				// meterOrGroup was removed
				removedMeterOrGroupID && removedMeterOrGroup &&
				// Removed meterOrGroup is the currently active on the 3D page
				removedMeterOrGroupID === state.threeD.meterOrGroupID && removedMeterOrGroup === state.threeD.meterOrGroup
			) {
				state.threeD.meterOrGroupID = undefined
				state.threeD.meterOrGroup = undefined

			}
		},
		updateSelectedGroupsFromSelect: (state, action: PayloadAction<{ newMetersOrGroups: number[], meta: ActionMeta<SelectOption> }>) => {
			state.selectedGroups = action.payload.newMetersOrGroups
		}
	},
	extraReducers: builder => {
		builder.addCase(adminSlice.actions.receivePreferences,
			(state, action) => {
				if (state.selectedAreaUnit == AreaUnitType.none) {
					state.selectedAreaUnit = action.payload.defaultAreaUnit

				}
			})
	}
})
