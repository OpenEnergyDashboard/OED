/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import * as moment from 'moment';
import * as _ from 'lodash'
import { ActionMeta } from 'react-select';
import { TimeInterval } from '../../../common/TimeInterval';
import { preferencesApi } from '../redux/api/preferencesApi';
import { SelectOption } from '../types/items';
import { ChartTypes, GraphState, GraphStateHistory, LineGraphRate, MeterOrGroup, ReadingInterval } from '../types/redux/graph';
import { ComparePeriod, SortingOrder, calculateCompareTimeInterval } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	selectedUnit: -99,
	selectedAreaUnit: AreaUnitType.none,
	queryTimeInterval: TimeInterval.unbounded(),
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
	},
	backHistoryStack: [],
	forwardHistoryStack: []
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
			// If Payload is defined, update selectedUnit
			if (action.payload) {
				state.selectedUnit = action.payload
			} else {
				// If NewValue is undefined, the current Unit has been cleared
				// Reset groups and meters, and selected unit
				state.selectedUnit = -99
				state.selectedMeters = []
				state.selectedGroups = []
			}
		},
		updateSelectedAreaUnit: (state, action: PayloadAction<AreaUnitType>) => {
			state.selectedAreaUnit = action.payload
		},
		updateBarDuration: (state, action: PayloadAction<moment.Duration>) => {
			state.barDuration = action.payload
		},
		updateTimeInterval: (state, action: PayloadAction<TimeInterval>) => {
			state.queryTimeInterval = action.payload
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
		setAreaNormalization: (state, action: PayloadAction<boolean>) => {
			state.areaNormalization = action.payload
		},
		toggleShowMinMax: state => {
			state.showMinMax = !state.showMinMax
		},
		setShowMinMax: (state, action: PayloadAction<boolean>) => {
			state.showMinMax = action.payload
		},
		changeBarStacking: state => {
			state.barStacking = !state.barStacking
		},
		setBarStacking: (state, action: PayloadAction<boolean>) => {
			state.barStacking = action.payload
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
		setOptionsVisibility: (state, action: PayloadAction<boolean>) => {
			state.optionsVisibility = action.payload
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
		updateThreeDMeterOrGroupID: (state, action: PayloadAction<number>) => {
			state.threeD.meterOrGroupID = action.payload
		},
		updateThreeDMeterOrGroup: (state, action: PayloadAction<MeterOrGroup>) => {
			state.threeD.meterOrGroup = action.payload
		},
		updateSelectedMetersOrGroups: (state, action: PayloadAction<{ newMetersOrGroups: number[], meta: ActionMeta<SelectOption> }>) => {
			// This reducer handles the addition and subtraction values for both the meter and group select components.
			// The 'MeterOrGroup' type is heavily utilized in the reducer and other parts of the code.
			// Note that this option is binary, if it's not a meter, then it's a group.

			// Destructure payload
			const { newMetersOrGroups, meta } = action.payload;

			// Used to check if value has been added or removed
			// If 'meta.option' is defined, it indicates that a single value has been added or selected.
			const addedMeterOrGroupID = meta.option?.value;
			const addedMeterOrGroup = meta.option?.meterOrGroup;
			const addedMeterOrGroupUnit = meta.option?.defaultGraphicUnit;

			//  If 'meta.removedValue' is defined, it indicates that a single value has been removed or deselected.
			const removedMeterOrGroupID = meta.removedValue?.value;
			const removedMeterOrGroup = meta.removedValue?.meterOrGroup;

			// If meta.removedValues is defined, it indicates that all values have been cleared.
			const clearedMeterOrGroups = meta.removedValues;

			// Generic if else block pertaining to all graph types
			// Check for the three possible scenarios of a change in the meters
			if (clearedMeterOrGroups) {
				// A Select has been cleared(all values removed with clear)
				// use the first index of cleared items to check for meter or group
				const isAMeter = clearedMeterOrGroups[0].meterOrGroup === MeterOrGroup.meters
				// if a meter clear meters, else clear groups
				isAMeter ? state.selectedMeters = [] : state.selectedGroups = []

			} else if (removedMeterOrGroup) {
				// An entry was deleted.
				// Update either selected meters or groups

				removedMeterOrGroup === MeterOrGroup.meters ?
					state.selectedMeters = newMetersOrGroups
					:
					state.selectedGroups = newMetersOrGroups

			} else if (addedMeterOrGroup) {
				// An entry was added,
				// Update either selected meters or groups
				addedMeterOrGroup === MeterOrGroup.meters ?
					state.selectedMeters = newMetersOrGroups
					:
					state.selectedGroups = newMetersOrGroups

				// If the current unit is -99, there is not yet a graphic unit
				// Set the newly added meterOrGroup's default graphic unit as the current selected unit.
				if (state.selectedUnit === -99 && addedMeterOrGroupUnit) {
					state.selectedUnit = addedMeterOrGroupUnit;
				}
			}


			// Blocks Pertaining to behaviors of specific pages

			// Additional 3d logic
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
		updateHistory: (state, action: PayloadAction<GraphStateHistory>) => {
			state.backHistoryStack.push(action.payload)
			// reset forward history on new visit
			state.forwardHistoryStack = []
		},
		prevHistory: state => {
			if (state.backHistoryStack.length > 1) {
				state.forwardHistoryStack.push(state.backHistoryStack.pop()!)
			}
			Object.assign(state, state.backHistoryStack[state.backHistoryStack.length - 1]);
		},
		nextHistory: state => {
			if (state.forwardHistoryStack.length) {
				state.backHistoryStack.push(state.forwardHistoryStack.pop()!)
				Object.assign(state, state.backHistoryStack[state.backHistoryStack.length - 1])
			}


		},
		resetTimeInterval: state => {
			if (!state.queryTimeInterval.equals(TimeInterval.unbounded())) {
				state.queryTimeInterval = TimeInterval.unbounded()
			}
		}
	},
	extraReducers: builder => {
		builder.addMatcher(preferencesApi.endpoints.getPreferences.matchFulfilled, (state, action) => {
			if (state.selectedAreaUnit === AreaUnitType.none) {
				state.selectedAreaUnit = action.payload.defaultAreaUnit;
			}
			if (!state.hotlinked) {
				state.chartToRender = action.payload.defaultChartToRender
				state.barStacking = action.payload.defaultBarStacking
				state.areaNormalization = action.payload.defaultAreaNormalization
			}
			state.backHistoryStack.push(_.omit(state, ['backHistoryStack', 'forwardHistoryStack']))
		})
	},
	// New Feature as of 2.0.0 Beta.
	selectors: {
		selectThreeDState: state => state.threeD,
		selectBarWidthDays: state => state.barDuration,
		selectGraphState: state => state,
		selectSelectedMeters: state => state.selectedMeters,
		selectSelectedGroups: state => state.selectedGroups,
		selectQueryTimeInterval: state => state.queryTimeInterval,
		selectGraphUnitID: state => state.selectedUnit,
		selectGraphAreaNormalization: state => state.areaNormalization,
		selectChartToRender: state => state.chartToRender,
		selectThreeDMeterOrGroup: state => state.threeD.meterOrGroup,
		selectThreeDMeterOrGroupID: state => state.threeD.meterOrGroupID,
		selectThreeDReadingInterval: state => state.threeD.readingInterval,
		selectLineGraphRate: state => state.lineGraphRate,
		selectAreaUnit: state => state.selectedAreaUnit,
		selectSortingOrder: state => state.compareSortingOrder
	}
})

// Selectors that can be imported and used in 'useAppSelectors' and 'createSelectors'
export const {
	selectThreeDState,
	selectBarWidthDays,
	selectGraphState,
	selectSelectedMeters,
	selectSelectedGroups,
	selectQueryTimeInterval,
	selectGraphUnitID,
	selectGraphAreaNormalization,
	selectChartToRender,
	selectThreeDMeterOrGroup,
	selectThreeDMeterOrGroupID,
	selectThreeDReadingInterval,
	selectLineGraphRate,
	selectAreaUnit,
	selectSortingOrder
} = graphSlice.selectors

// actionCreators exports
export const {
	confirmGraphRenderOnce,
	updateSelectedMeters,
	updateSelectedGroups,
	updateSelectedUnit,
	updateSelectedAreaUnit,
	updateBarDuration,
	updateTimeInterval,
	changeSliderRange,
	resetRangeSliderStack,
	updateComparePeriod,
	changeChartToRender,
	toggleAreaNormalization,
	setAreaNormalization,
	toggleShowMinMax,
	setShowMinMax,
	changeBarStacking,
	setBarStacking,
	setHotlinked,
	changeCompareSortingOrder,
	toggleOptionsVisibility,
	setOptionsVisibility,
	updateLineGraphRate,
	updateThreeDReadingInterval,
	updateThreeDMeterOrGroupInfo,
	updateThreeDMeterOrGroupID,
	updateThreeDMeterOrGroup,
	updateSelectedMetersOrGroups,
	resetTimeInterval,
	updateHistory,
	prevHistory,
	nextHistory
} = graphSlice.actions