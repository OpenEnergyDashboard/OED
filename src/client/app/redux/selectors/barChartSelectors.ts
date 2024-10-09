/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import * as moment from 'moment';
import { BarReadings } from 'types/readings';
import { selectWidthDays } from '../../redux/slices/graphSlice';
import { DataType } from '../../types/Datasources';
import { MeterOrGroup } from '../../types/redux/graph';
import getGraphColor from '../../utils/getGraphColor';
import { createAppSelector } from './selectors';
import { selectAreaScalingFromEntity, selectNameFromEntity } from './entitySelectors';
import { selectPlotlyMeterDeps, selectPlotlyGroupDeps } from './plotlyDataSelectors';

type PlotlyBarDeps = ReturnType<typeof selectPlotlyMeterDeps> & { barDuration: moment.Duration }
export const selectPlotlyBarDeps = createAppSelector(
	[
		selectPlotlyMeterDeps,
		selectPlotlyGroupDeps,
		selectWidthDays
	],
	(meterDeps, groupDeps, barDuration) => {
		const barMeterDeps = { ...meterDeps, barDuration };
		const barGroupDeps = { ...groupDeps, barDuration };
		return { barMeterDeps, barGroupDeps };
	}
);

// Selector that derives meter data for the bar graphic
export const selectPlotlyBarDataFromResult = createSelector.withTypes<BarReadings>()(
	[
		// Query data
		// Data derivation dependencies. Use ReturnType inference to get type from dependency selector.
		data => data,
		(_data, dependencies: PlotlyBarDeps) => dependencies
	],
	(data, { areaNormalization, compatibleEntities, meterDataById, groupDataById, meterOrGroup, barDuration, barUnitLabel, areaUnit }) => {
		const plotlyData: Partial<Plotly.PlotData>[] = Object.entries(data)
			// filter entries for requested groups
			.filter(([id]) => compatibleEntities.includes((Number(id))))
			.map(([id, readings]) => {
				const entityId = Number(id);
				const entity = meterOrGroup === MeterOrGroup.meters ? meterDataById[entityId] : groupDataById[entityId];
				const entityArea = selectAreaScalingFromEntity(entity, areaUnit, areaNormalization);
				const label = selectNameFromEntity(entity);
				const colorID = entity.id;

				// Create two arrays for the x and y values. Fill the array with the data.
				const xData: string[] = [];
				const yData: number[] = [];
				const hoverText: string[] = [];
				readings.forEach(barReading => {
					const st = moment.utc(barReading.startTimestamp);
					// Time reading is in the middle of the start and end timestamp (may change this depending on how it looks on the bar graph)\
					const timeReading = st.add(moment.utc(barReading.endTimestamp).diff(st) / 2);
					xData.push(timeReading.utc().format('YYYY-MM-DD HH:mm:ss'));
					let readingValue = barReading.reading;
					if (areaNormalization) {
						readingValue /= entityArea;
					}
					yData.push(readingValue);
					// only display a range of dates for the hover text if there is more than one day in the range
					let timeRange: string = `${moment.utc(barReading.startTimestamp).format('ll')}`;
					if (barDuration.asDays() != 1) {
						// subtracting one extra day caused by day ending at midnight of the next day.
						// Going from DB unit timestamp that is UTC so force UTC with moment, as usual.
						timeRange += ` - ${moment.utc(barReading.endTimestamp).subtract(1, 'days').format('ll')}`;
					}
					hoverText.push(`<b> ${timeRange} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${barUnitLabel}`);
				});
				// This variable contains all the elements (x and y values, bar type, etc.) assigned to the data parameter of the Plotly object
				return {
					name: label,
					x: xData,
					y: yData,
					text: hoverText,
					hoverinfo: 'text',
					type: 'bar',
					marker: { color: getGraphColor(colorID, DataType.Meter) }
				};
			});
		return plotlyData;
	}
);
