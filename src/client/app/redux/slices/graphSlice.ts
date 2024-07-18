/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { ActionMeta } from 'react-select';
import { TimeInterval } from '../../../../common/TimeInterval';
import {
	clearGraphHistory, historyStepBack,
	historyStepForward, processGraphLink,
	updateHistory, updateSliderRange
} from '../../redux/actions/extraActions';
import { SelectOption } from '../../types/items';
import { ChartTypes, GraphState, LineGraphRate, MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { ComparePeriod, SortingOrder, calculateCompareTimeInterval, validateComparePeriod, validateSortingOrder } from '../../utils/calculateCompare';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { preferencesApi } from '../api/preferencesApi';

const defaultState: GraphState = {
	selectedMeters: [],
	selectedGroups: [],
	selectedUnit: -99,
	selectedAreaUnit: AreaUnitType.none,
	queryTimeInterval: TimeInterval.unbounded(),
	rangeSliderInterval: TimeInterval.unbounded(),
	barDuration: moment.duration(4, 'weeks'),
	mapsBarDuration: moment.duration(4, 'weeks'),
	comparePeriod: ComparePeriod.Week,
	compareTimeInterval: calculateCompareTimeInterval(ComparePeriod.Week, moment()),
	compareSortingOrder: SortingOrder.Descending,
	chartToRender: ChartTypes.line,
	barStacking: false,
	areaNormalization: false,
	lineGraphRate: { label: 'hour', rate: 1 },
	showMinMax: false,
	threeD: {
		meterOrGroupID: undefined,
		meterOrGroup: undefined,
		readingInterval: ReadingInterval.Hourly
	},
	hotlinked: false
};

interface History<T> {
	prev: Array<T>
	current: T
	next: Array<T>
}
const initialState: History<GraphState> = {
	prev: [],
	current: defaultState,
	next: []
};

export const graphSlice = createSlice({
	name: 'graph',
	initialState: initialState,
	reducers: {
		updateSelectedMeters: (state, action: PayloadAction<number[]>) => {
			state.current.selectedMeters = action.payload;
		},
		updateSelectedGroups: (state, action: PayloadAction<number[]>) => {
			state.current.selectedGroups = action.payload;
		},
		updateSelectedUnit: (state, action: PayloadAction<number>) => {
			// If Payload is defined, update selectedUnit
			if (action.payload) {
				state.current.selectedUnit = action.payload;
			} else {
				// If NewValue is undefined, the current Unit has been cleared
				// Reset groups and meters, and selected unit
				state.current.selectedUnit = -99;
				state.current.selectedMeters = [];
				state.current.selectedGroups = [];
			}
		},
		updateSelectedAreaUnit: (state, action: PayloadAction<AreaUnitType>) => {
			state.current.selectedAreaUnit = action.payload;
		},
		updateBarDuration: (state, action: PayloadAction<moment.Duration>) => {
			state.current.barDuration = action.payload;
		},
		updateMapsBarDuration: (state, action: PayloadAction<moment.Duration>) => {
			state.current.mapsBarDuration = action.payload;
		},
		updateTimeInterval: (state, action: PayloadAction<TimeInterval>) => {
			// always update if action is bounded, else only set unbounded if current isn't already unbounded.
			// clearing when already unbounded should be a no-op
			if (action.payload.getIsBounded() || state.current.queryTimeInterval.getIsBounded()) {
				state.current.queryTimeInterval = action.payload;
			}
		},
		changeSliderRange: (state, action: PayloadAction<TimeInterval>) => {
			if (action.payload.getIsBounded() || state.current.rangeSliderInterval.getIsBounded()) {
				state.current.rangeSliderInterval = action.payload;
			}
		},
		resetRangeSliderStack: state => {
			state.current.rangeSliderInterval = TimeInterval.unbounded();
		},
		updateComparePeriod: (state, action: PayloadAction<{ comparePeriod: ComparePeriod, currentTime: moment.Moment }>) => {
			state.current.comparePeriod = action.payload.comparePeriod;
			state.current.compareTimeInterval = calculateCompareTimeInterval(action.payload.comparePeriod, action.payload.currentTime);
		},
		changeChartToRender: (state, action: PayloadAction<ChartTypes>) => {
			state.current.chartToRender = action.payload;
		},
		toggleAreaNormalization: state => {
			state.current.areaNormalization = !state.current.areaNormalization;
		},
		setAreaNormalization: (state, action: PayloadAction<boolean>) => {
			state.current.areaNormalization = action.payload;
		},
		toggleShowMinMax: state => {
			state.current.showMinMax = !state.current.showMinMax;
		},
		setShowMinMax: (state, action: PayloadAction<boolean>) => {
			state.current.showMinMax = action.payload;
		},
		changeBarStacking: state => {
			state.current.barStacking = !state.current.barStacking;
		},
		setBarStacking: (state, action: PayloadAction<boolean>) => {
			state.current.barStacking = action.payload;
		},
		changeCompareSortingOrder: (state, action: PayloadAction<SortingOrder>) => {
			state.current.compareSortingOrder = action.payload;
		},
		updateLineGraphRate: (state, action: PayloadAction<LineGraphRate>) => {
			state.current.lineGraphRate = action.payload;
		},
		updateThreeDReadingInterval: (state, action: PayloadAction<ReadingInterval>) => {
			state.current.threeD.readingInterval = action.payload;
		},
		updateThreeDMeterOrGroupID: (state, action: PayloadAction<number | undefined>) => {
			if (state.current.threeD.meterOrGroupID !== action.payload) {
				state.current.threeD.meterOrGroupID = action.payload;
			}
		},
		updateThreeDMeterOrGroup: (state, action: PayloadAction<MeterOrGroup>) => {
			if (state.current.threeD.meterOrGroup !== action.payload) {
				state.current.threeD.meterOrGroup = action.payload;
			}
		},
		updateThreeDMeterOrGroupInfo: (state, action: PayloadAction<{ meterOrGroupID: number | undefined, meterOrGroup: MeterOrGroup }>) => {
			const { updateThreeDMeterOrGroupID, updateThreeDMeterOrGroup } = graphSlice.caseReducers;
			updateThreeDMeterOrGroupID(state, graphSlice.actions.updateThreeDMeterOrGroupID(action.payload.meterOrGroupID));
			updateThreeDMeterOrGroup(state, graphSlice.actions.updateThreeDMeterOrGroup(action.payload.meterOrGroup));
			// TODO Under development so in future
			// if (!state.current.queryTimeInterval.getIsBounded()) {
			// 	// Set the query time interval to 6 moths back when not bounded for 3D
			// 	state.current.queryTimeInterval = new TimeInterval(moment.utc().subtract(6, 'months'), moment.utc());
			// }
		},
		updateSelectedMetersOrGroups: (state, action: PayloadAction<{ newMetersOrGroups: number[], meta: ActionMeta<SelectOption> }>) => {
			const { current } = state;
			// This reducer handles the addition and subtraction values for both the meter and group select components.
			// The 'MeterOrGroup' type is heavily utilized in the reducer and other parts of the code.
			// Note that this option is binary, if it's not a meter, then it's a group.

			// Destructure payload
			const { newMetersOrGroups, meta } = action.payload;
			const cleared = meta.action === 'clear';
			const valueRemoved = (meta.action === 'pop-value' || meta.action === 'remove-value') && meta.removedValue !== undefined;
			const valueAdded = meta.action === 'select-option' && meta.option !== undefined;
			let isAMeter = true;

			if (cleared) {
				const clearedMeterOrGroups = meta.removedValues;
				// A Select has been cleared (all values removed with clear)
				// use the first index of cleared items to check for meter or group
				isAMeter = clearedMeterOrGroups[0].meterOrGroup === MeterOrGroup.meters;
				// if a meter clear meters, else clear groups
				isAMeter ? current.selectedMeters = [] : current.selectedGroups = [];

			} else if (valueRemoved) {
				isAMeter = meta.removedValue.meterOrGroup === MeterOrGroup.meters;
				// An entry was deleted.
				// Update either selected meters or groups

				isAMeter
					? current.selectedMeters = newMetersOrGroups
					: current.selectedGroups = newMetersOrGroups;
			} else if (valueAdded) {
				isAMeter = meta.option?.meterOrGroup === MeterOrGroup.meters;
				const addedMeterOrGroupUnit = meta.option?.defaultGraphicUnit;
				// An entry was added,
				// Update either selected meters or groups
				isAMeter
					? current.selectedMeters = newMetersOrGroups
					: current.selectedGroups = newMetersOrGroups;

				// If the current unit is -99, there is not yet a graphic unit
				// Set the newly added meterOrGroup's default graphic unit as the current selected unit.
				if (current.selectedUnit === -99 && addedMeterOrGroupUnit) {
					current.selectedUnit = addedMeterOrGroupUnit;
				}
			}

			// Blocks Pertaining to behaviors of specific pages below

			// Additional 3d logic for each case.
			// Reset Currently Selected 3D Meter Or Group if it has been removed from any page
			if (cleared) {
				const removedType = meta.removedValues[0].meterOrGroup;
				const threeDSelectedType = current.threeD.meterOrGroup;
				if (removedType === threeDSelectedType) {
					current.threeD.meterOrGroupID = undefined;
					current.threeD.meterOrGroup = undefined;

				}
			} else if (valueAdded && current.chartToRender === ChartTypes.threeD) {
				// When a meter or group is selected/added, make it the currently active in 3D current.
				// TODO Currently only tracks when on 3d, Verify that this is the desired behavior
				// re-use existing reducers, action creators
				graphSlice.caseReducers.updateThreeDMeterOrGroupInfo(state,
					graphSlice.actions.updateThreeDMeterOrGroupInfo({
						meterOrGroupID: meta.option!.value,
						meterOrGroup: meta.option!.meterOrGroup!
					})
				);
			} else if (valueRemoved) {
				const idMatches = meta.removedValue.value === current.threeD.meterOrGroupID;
				const typeMatches = meta.removedValue.meterOrGroup === current.threeD.meterOrGroup;
				if (idMatches && typeMatches) {
					current.threeD.meterOrGroupID = undefined;
					current.threeD.meterOrGroup = undefined;
				}
			}
		},
		resetTimeInterval: state => {
			if (!state.current.queryTimeInterval.equals(TimeInterval.unbounded())) {
				state.current.queryTimeInterval = TimeInterval.unbounded();
			}
		},
		setGraphState: (state, action: PayloadAction<GraphState>) => {
			state.current = action.payload;
		}

	},
	extraReducers: builder => {
		builder
			.addCase(
				updateHistory,
				(state, action) => {
					state.next = [];
					state.prev.push(action.payload);
				}
			)
			.addCase(
				historyStepBack,
				state => {
					const prev = state.prev.pop();
					if (prev) {
						state.next.push(state.current);
						state.current = prev;
					}
				}
			)
			.addCase(
				historyStepForward,
				state => {
					const next = state.next.pop();
					if (next) {
						state.prev.push(state.current);
						state.current = next;
					}
				}
			)
			.addCase(
				clearGraphHistory,
				state => {
					state.current = cloneDeep(defaultState);
					state.prev = [];
					state.next = [];
				}
			)
			.addCase(
				updateSliderRange,
				(state, { payload }) => {
					state.current.rangeSliderInterval = payload;
				}
			)
			.addCase(
				processGraphLink,
				({ current }, { payload }) => {
					current.hotlinked = true;
					payload.forEach((value, key) => {
						// TODO Needs to be refactored into a single dispatch/reducer pair.
						// It is a best practice to reduce the number of dispatch calls, so this logic should be converted into a single reducer for the graphSlice
						// TODO validation could be implemented across all cases similar to compare period and sorting order
						switch (key) {
							case 'areaNormalization':
								current.areaNormalization = value === 'true';
								break;
							case 'areaUnit':
								current.selectedAreaUnit = value as AreaUnitType;
								break;
							case 'barDuration':
								current.barDuration = moment.duration(parseInt(value), 'days');
								break;
							case 'barStacking':
								current.barStacking = value === 'true';
								break;
							case 'chartType':
								current.chartToRender = value as ChartTypes;
								break;
							case 'comparePeriod':
								{
									current.comparePeriod = validateComparePeriod(value);
									current.compareTimeInterval = calculateCompareTimeInterval(validateComparePeriod(value), moment());
								}
								break;
							case 'compareSortingOrder':
								current.compareSortingOrder = validateSortingOrder(value);
								break;
							case 'groupIDs':
								current.selectedGroups = value.split(',').map(s => parseInt(s));
								break;
							case 'meterIDs':
								current.selectedMeters = value.split(',').map(s => parseInt(s));
								break;
							case 'meterOrGroup':
								current.threeD.meterOrGroup = value as MeterOrGroup;
								break;
							case 'meterOrGroupID':
								current.threeD.meterOrGroupID = parseInt(value);
								break;
							case 'minMax':
								current.showMinMax = value === 'true';
								break;
							case 'rate':
								{
									const params = value.split(',');
									const rate = { label: params[0], rate: parseFloat(params[1]) } as LineGraphRate;
									current.lineGraphRate = rate;
								}
								break;
							case 'readingInterval':
								current.threeD.readingInterval = parseInt(value);
								break;
							case 'serverRange':
								current.queryTimeInterval = TimeInterval.fromString(value);
								break;
							case 'sliderRange':
								// TODO omitted for now re-implement later.
								// current.rangeSliderInterval = TimeInterval.fromString(value);
								break;
							case 'unitID':
								current.selectedUnit = parseInt(value);
								break;
						}
					});
				}
			)
			.addMatcher(preferencesApi.endpoints.getPreferences.matchFulfilled, ({ current }, action) => {
				if (!current.hotlinked) {
					const { defaultAreaUnit, defaultChartToRender, defaultBarStacking, defaultAreaNormalization } = action.payload;
					current.selectedAreaUnit = defaultAreaUnit;
					current.chartToRender = defaultChartToRender;
					current.barStacking = defaultBarStacking;
					current.areaNormalization = defaultAreaNormalization;
				}
			});
	},
	selectors: {
		selectGraphState: state => state.current,
		selectPrevHistory: state => state.prev,
		selectForwardHistory: state => state.next,
		selectThreeDState: state => state.current.threeD,
		selectShowMinMax: state => state.current.showMinMax,
		selectBarStacking: state => state.current.barStacking,
		selectBarWidthDays: state => state.current.barDuration,
		selectMapBarWidthDays: state => state.current.mapsBarDuration,
		selectAreaUnit: state => state.current.selectedAreaUnit,
		selectSelectedUnit: state => state.current.selectedUnit,
		selectChartToRender: state => state.current.chartToRender,
		selectLineGraphRate: state => state.current.lineGraphRate,
		selectComparePeriod: state => state.current.comparePeriod,
		selectSelectedMeters: state => state.current.selectedMeters,
		selectSelectedGroups: state => state.current.selectedGroups,
		selectSortingOrder: state => state.current.compareSortingOrder,
		selectQueryTimeInterval: state => state.current.queryTimeInterval,
		selectThreeDMeterOrGroup: state => state.current.threeD.meterOrGroup,
		selectCompareTimeInterval: state => state.current.compareTimeInterval,
		selectGraphAreaNormalization: state => state.current.areaNormalization,
		selectThreeDMeterOrGroupID: state => state.current.threeD.meterOrGroupID,
		selectThreeDReadingInterval: state => state.current.threeD.readingInterval,
		selectDefaultGraphState: () => defaultState,
		selectHistoryIsDirty: state => state.prev.length > 0 || state.next.length > 0,
		selectSliderRangeInterval: state => state.current.rangeSliderInterval,
		selectPlotlySliderMin: state => state.current.rangeSliderInterval.getStartTimestamp()?.utc().toDate().toISOString(),
		selectPlotlySliderMax: state => state.current.rangeSliderInterval.getEndTimestamp()?.utc().toDate().toISOString()
	}
});

// Selectors that can be imported and used in 'useAppSelectors' and 'createSelectors'
export const {
	selectAreaUnit, selectShowMinMax,
	selectGraphState, selectPrevHistory,
	selectThreeDState, selectBarStacking,
	selectSortingOrder, selectBarWidthDays,
	selectSelectedUnit, selectLineGraphRate,
	selectComparePeriod, selectChartToRender,
	selectForwardHistory, selectSelectedMeters,
	selectSelectedGroups, selectQueryTimeInterval,
	selectThreeDMeterOrGroup, selectCompareTimeInterval,
	selectThreeDMeterOrGroupID, selectThreeDReadingInterval,
	selectGraphAreaNormalization, selectSliderRangeInterval,
	selectDefaultGraphState, selectHistoryIsDirty,
	selectPlotlySliderMax, selectPlotlySliderMin,
	selectMapBarWidthDays
} = graphSlice.selectors;

// actionCreators exports
export const {
	setShowMinMax, setGraphState,
	setBarStacking, toggleShowMinMax,
	changeBarStacking, resetTimeInterval,
	updateBarDuration, changeSliderRange,
	updateTimeInterval, updateSelectedUnit,
	changeChartToRender, updateComparePeriod,
	updateSelectedMeters, updateLineGraphRate,
	setAreaNormalization, updateSelectedGroups,
	resetRangeSliderStack, updateSelectedAreaUnit,
	toggleAreaNormalization, updateThreeDMeterOrGroup,
	changeCompareSortingOrder, updateThreeDMeterOrGroupID,
	updateThreeDReadingInterval, updateThreeDMeterOrGroupInfo,
	updateSelectedMetersOrGroups, updateMapsBarDuration
} = graphSlice.actions;

