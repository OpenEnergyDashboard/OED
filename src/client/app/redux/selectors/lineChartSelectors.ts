/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import * as moment from 'moment';
import { createStructuredSelector } from 'reselect';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import {
	selectAreaUnit, selectGraphAreaNormalization,
	selectLineGraphRate,
	selectSelectedGroups,
	selectSelectedMeters, selectSelectedUnit, selectShowMinMax
} from '../../redux/slices/graphSlice';
import { DataType } from '../../types/Datasources';
import { LineReadings } from '../../types/readings';
import { AreaUnitType, getAreaUnitConversion } from '../../utils/getAreaUnitConversion';
import getGraphColor from '../../utils/getGraphColor';
import { lineUnitLabel } from '../../utils/graphics';
import translate from '../../utils/translate';
import { createAppSelector } from './selectors';

// Line and Groups use these values to derive plotly data, so make selector for them to 'extend'
export const selectCommonPlotlyDependencies = createStructuredSelector(
	{
		selectedUnit: selectSelectedUnit,
		lineGraphRate: selectLineGraphRate,
		areaUnit: selectAreaUnit,
		areaNormalization: selectGraphAreaNormalization,
		meterDataById: selectMeterDataById,
		groupDataById: selectGroupDataById,
		unitDataById: selectUnitDataById
	},
	createAppSelector
)

// All values needed to derive meter data in selectFromResult for plotly line chart
export const selectPlotlyMeterDeps = createAppSelector(
	[selectCommonPlotlyDependencies, selectSelectedMeters, selectShowMinMax],
	(deps, selectedMeters, showMinMax) => ({ ...deps, selectedMeters, showMinMax })
)

// All values needed to derive group data in selectFromResult for plotly line chart
export const selectPlotlyGroupDeps = createAppSelector(
	[selectCommonPlotlyDependencies, selectSelectedGroups],
	(deps, selectedGroups) => ({ ...deps, selectedGroups })
)

// Structured selector from line & group dependencies, as a utility to call in the component.
export const selectLineChartDeps = createStructuredSelector(
	{
		plotlyMeterDeps: selectPlotlyMeterDeps,
		plotlyGroupDeps: selectPlotlyGroupDeps
	},
	createAppSelector
)

// custom typed selector to handle first arg of select from result. for data of type lineReadings.
const selectFromLineReadingsResult = createSelector.withTypes<LineReadings>();

// Selector that derives meter data for the line graphic
export const selectPlotlyMeterData = selectFromLineReadingsResult(
	[
		// Query data
		data => data,
		// Data derivation dependencies. Use ReturnType inference to get type from dependency selector.
		(_data, dependencies: ReturnType<typeof selectPlotlyMeterDeps>) => dependencies
	],
	(data, deps) => {
		console.log('Firing Meters')
		const { selectedUnit, lineGraphRate, areaUnit, areaNormalization, meterDataById, unitDataById, selectedMeters, showMinMax } = deps
		let unitLabel = '';
		let needsRateScaling = false;
		// // variables to determine the slider min and max
		let minTimestamp: number | undefined;
		let maxTimestamp: number | undefined;
		// // If graphingUnit is -99 then none selected and nothing to graph so label is empty.
		// // This will probably happen when the page is first loaded.
		if (selectedUnit !== -99) {
			const selectUnitState = unitDataById[selectedUnit];
			if (selectUnitState !== undefined) {
				// Determine the y-axis label and if the rate needs to be scaled.
				const returned = lineUnitLabel(selectUnitState, lineGraphRate, areaNormalization, areaUnit);
				unitLabel = returned.unitLabel
				needsRateScaling = returned.needsRateScaling;
			}
		}
		// // The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
		const rateScaling = needsRateScaling ? lineGraphRate.rate : 1;

		// Add all valid data from existing meters to the line plot
		const meterReadings = Object.entries(data).filter(([meterID]) => selectedMeters.includes((Number(meterID))))

		const plotlyLineData: Partial<Plotly.PlotData>[] = []
		meterReadings.forEach(([id, readings]) => {
			const meterID = Number(id)
			const meterInfo = meterDataById[meterID]
			const meterArea = meterInfo.area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!areaNormalization || (meterArea > 0 && meterInfo.areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = areaNormalization ? meterArea * getAreaUnitConversion(meterInfo.areaUnit, areaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				const label = meterInfo.identifier;
				const colorID = meterID;

				// Create two arrays for the x and y values. Fill the array with the data from the line readings
				const xData: string[] = [];
				const yData: number[] = [];
				// Create two arrays to store the min and max values of y-axis data points
				const yMinData: number[] = [];
				const yMaxData: number[] = [];
				const hoverText: string[] = [];
				// The scaling is the factor to change the reading by. It divides by the area while will be 1 if no scaling by area.
				readings.forEach(reading => {
					// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
					// are equivalent to Unix timestamp in milliseconds.
					const st = moment.utc(reading.startTimestamp);
					// Time reading is in the middle of the start and end timestamp
					const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
					xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
					const readingValue = reading.reading * scaling;
					yData.push(readingValue);
					// All hover have the date, meter name and value.
					const hoverStart = `<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`;
					if (showMinMax && reading.max != null) {
						// We want to show min/max. Note if the data is raw for this meter then all the min/max values are null.
						// In this case we still push the min/max but plotly will not show them. This is a little extra work
						// but makes the code cleaner.
						const minValue = reading.min * scaling;
						yMinData.push(minValue);
						const maxValue = reading.max * scaling;
						yMaxData.push(maxValue);
						hoverText.push(`${hoverStart} <br> ${translate('min')}: ${minValue.toPrecision(6)} <br> ${translate('max')}: ${maxValue.toPrecision(6)}`);
					} else {
						hoverText.push(hoverStart);
					}
				});

				/*
				get the min and max timestamp of the meter, and compare it to the global values
				TODO: If we know the interval and frequency of meter data, these calculations should be able to be simplified
				*/
				if (readings.length > 0) {
					const startFirstTimestamp = readings[0].startTimestamp
					const endFirstTimestamp = readings[0].endTimestamp
					if (!minTimestamp || startFirstTimestamp < minTimestamp) {
						minTimestamp = startFirstTimestamp;
					}

					const endTimestamp = readings[readings.length - 1].endTimestamp
					if (maxTimestamp == undefined || endTimestamp >= maxTimestamp) {
						// Need to add one extra reading interval to avoid range truncation. The max bound seems to be treated as non-inclusive
						maxTimestamp = endTimestamp + (endFirstTimestamp - startFirstTimestamp);
					}
				}

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				plotlyLineData.push({
					name: label,
					x: xData,
					y: yData,
					// only show error bars if enabled and there is data
					error_y: showMinMax && yMaxData.length > 0 ? {
						type: 'data',
						symmetric: false,
						array: yMaxData.map((maxValue, index) => (maxValue - yData[index])),
						arrayminus: yData.map((value, index) => (value - yMinData[index]))
					} : undefined,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {
						shape: 'spline',
						width: 2,
						color: getGraphColor(colorID, DataType.Meter)
					}
				})
			}
		})
		return plotlyLineData
	}
)

export const selectPlotlyGroupData = selectFromLineReadingsResult(
	[
		data => data,
		(_data, dependencies: ReturnType<typeof selectPlotlyGroupDeps>) => dependencies
	],
	(data, deps) => {
		console.log('Firing Groups')
		const { selectedUnit, lineGraphRate, areaUnit, areaNormalization, groupDataById, unitDataById, selectedGroups } = deps
		// Add all valid data from existing meters to the line plot
		const groupReadings = Object.entries(data).filter(([meterID]) => selectedGroups.includes((Number(meterID))))
		let unitLabel = '';
		let needsRateScaling = false;
		// // If graphingUnit is -99 then none selected and nothing to graph so label is empty.
		// // This will probably happen when the page is first loaded.
		if (selectedUnit !== -99) {
			const selectUnitState = unitDataById[selectedUnit];
			if (selectUnitState !== undefined) {
				// Determine the y-axis label and if the rate needs to be scaled.
				const returned = lineUnitLabel(selectUnitState, lineGraphRate, areaNormalization, areaUnit);
				unitLabel = returned.unitLabel
				needsRateScaling = returned.needsRateScaling;
			}
		}
		// // The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
		const rateScaling = needsRateScaling ? lineGraphRate.rate : 1;

		const plotlyLineData: Partial<Plotly.PlotData>[] = []
		groupReadings.forEach(([id, readings]) => {
			const groupID = Number(id)
			const groupInfo = groupDataById[groupID]
			const groupArea = groupInfo.area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!areaNormalization || (groupArea > 0 && groupInfo.areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = areaNormalization ? groupArea * getAreaUnitConversion(groupInfo.areaUnit, areaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				const label = groupInfo.name;
				const colorID = groupID;

				// Create two arrays for the x and y values. Fill the array with the data from the line readings
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				readings.forEach(reading => {
					// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
					// are equivalent to Unix timestamp in milliseconds.
					const st = moment.utc(reading.startTimestamp);
					// Time reading is in the middle of the start and end timestamp
					const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
					xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
					const readingValue = reading.reading * scaling;
					yData.push(readingValue);
					hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
				});

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				plotlyLineData.push({
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'scatter',
					mode: 'lines',
					line: {
						shape: 'spline',
						width: 2,
						color: getGraphColor(colorID, DataType.Group)
					}
				});
			}
		})
		return plotlyLineData

	})

export const selectPlotlyUnitLabel = createAppSelector(
	[
		selectSelectedUnit,
		selectAreaUnit,
		selectLineGraphRate,
		selectGraphAreaNormalization,
		selectUnitDataById
	],
	(selectedUnit, selectedAreaUnit, lineGraphRate, areaNormalization, unitDataById) => {
		let unitLabel = '';
		if (selectedUnit !== -99) {
			// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
			// This will probably happen when the page is first loaded.
			const selectUnitState = unitDataById[selectedUnit];
			if (selectUnitState !== undefined) {
				// Determine the y-axis label and if the rate needs to be scaled.
				const returned = lineUnitLabel(selectUnitState, lineGraphRate, areaNormalization, selectedAreaUnit);
				unitLabel = returned.unitLabel
			}
		}
		return unitLabel
	})