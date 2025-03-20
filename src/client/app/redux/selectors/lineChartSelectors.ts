/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { selectShowMinMax } from '../../redux/slices/graphSlice';
import { DataType } from '../../types/Datasources';
import getGraphColor from '../../utils/getGraphColor';
import translate from '../../utils/translate';
import { createAppSelector } from './selectors';
import { selectScalingFromEntity, selectNameFromEntity } from './entitySelectors';
import { selectPlotlyMeterDeps, selectPlotlyGroupDeps, selectFromLineReadingsResult } from './plotlyDataSelectors';

type PlotlyLineDeps = ReturnType<typeof selectPlotlyMeterDeps> & { showMinMax: boolean }
// Common deps + additional values needed to derive meter data in selectFromResult for plotly line chart
export const selectLineChartDeps = createAppSelector(
	[selectPlotlyMeterDeps, selectPlotlyGroupDeps, selectShowMinMax],
	(meterDep, groupDep, showMinMax) => {
		const meterDeps = { ...meterDep, showMinMax };
		const groupDeps = { ...groupDep, showMinMax };
		return { meterDeps, groupDeps };
	}
);

// Selector that derives meter data for the line graphic
export const selectPlotlyMeterData = selectFromLineReadingsResult(
	// Query data&& Data derivation dependencies. Use ReturnType inference to get type from dependency selector.
	[data => data, (_data, dependencies: PlotlyLineDeps) => dependencies],
	(data, { areaUnit, areaNormalization, meterDataById, compatibleEntities, showMinMax, lineUnitLabel, rateScaling }) => {
		const plotlyLineData = Object.entries(data)
			// filter entries for requested compatible groups
			// compatible entities is using the same data deriving selectors as the select option for group, & meter.
			.filter(([groupID]) => compatibleEntities.includes((Number(groupID))))
			.map(([id, readings]) => {
				const meterInfo = meterDataById[Number(id)];

				const scaling = selectScalingFromEntity(meterInfo, areaUnit, areaNormalization, rateScaling);
				const label = selectNameFromEntity(meterInfo);
				const colorID = meterInfo.id;

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
					const hoverStart = `<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${lineUnitLabel}`;
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

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				return {
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
				} as Partial<Plotly.PlotData>;
			});
		return plotlyLineData;
	}
);

export const selectPlotlyGroupData = selectFromLineReadingsResult(
	[data => data, (_data, dependencies: PlotlyLineDeps) => dependencies],
	(data, { areaUnit, areaNormalization, groupDataById, compatibleEntities, rateScaling, lineUnitLabel }) => {
		const plotlyData = Object.entries(data)
			// filter entries for requested groups
			.filter(([groupID]) => compatibleEntities.includes((Number(groupID))))
			.map(([id, readings]) => {
				const groupInfo = groupDataById[Number(id)];
				const scaling = selectScalingFromEntity(groupInfo, areaUnit, areaNormalization, rateScaling);
				const label = selectNameFromEntity(groupInfo);
				const colorID = groupInfo.id;

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
					hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${lineUnitLabel}`);
				});

				// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
				return {
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
				} as Partial<Plotly.PlotData>;
			});
		return plotlyData;
	});

