/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectLineChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectLineChartDeps, selectPlotlyGroupData, selectPlotlyMeterData } from '../redux/selectors/lineChartSelectors';
import { selectLineUnitLabel } from '../redux/selectors/plotlyDataSelectors';
import { LineReadings } from '../types/readings';
import translate from '../utils/translate';
import LogoSpinner from './LogoSpinner';
import { PlotOED } from './PlotOED';

// Stable reference for when there is not data. Avoids rerenders.
const stableEmptyReadings: LineReadings = {};
/**
 * @returns plotlyLine graphic
 */
export default function LineChartComponent() {
	// get current data fetching arguments
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectLineChartQueryArgs);
	// get data needed to derive/ format data from query response
	const { meterDeps, groupDeps } = useAppSelector(selectLineChartDeps);

	// Fetch data, and derive plotly points
	const { data: meterPlotlyData, isLoading: meterIsLoading } = readingsApi.useLineQuery(meterArgs,
		{
			skip: meterShouldSkip,
			// Custom Data Derivation with query hook properties.
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				// use query data as selector parameter, pass in data dependencies.
				// Data may still be in transit, so pass a stable empty reference if needed for memoization.
				data: selectPlotlyMeterData(data ?? stableEmptyReadings, meterDeps)
			})
		});

	const { data: groupPlotlyData = stableEmptyReadings, isLoading: groupIsLoading } = readingsApi.useLineQuery(groupArgs,
		{
			skip: groupShouldSkip,
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				data: selectPlotlyGroupData(data ?? stableEmptyReadings, groupDeps)
			})
		});

	// Use Query Data to derive plotly datasets memoized selector
	const unitLabel = useAppSelector(selectLineUnitLabel);

	const data: Partial<Plotly.PlotData>[] = React.useMemo(() => meterPlotlyData.concat(groupPlotlyData), [meterPlotlyData, groupPlotlyData]);
	const datasets = React.useDeferredValue(data);
	if (meterIsLoading || groupIsLoading) {
		return <LogoSpinner />;
	}


	// Check if there is at least one valid graph
	const ableToGraph = datasets.find(data => data.x!.length > 1);
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (datasets.length === 0) {
		return <h1>{`${translate('select.meter.group')}`}	</h1>;
	} else if (!ableToGraph) {
		return <h1>{`${translate('no.data.in.range')}`}</h1>;
	} else {
		return (
			<PlotOED
				data={datasets}
				layout={{
					autosize: true, showlegend: true,
					legend: { x: 0, y: 1.1, orientation: 'h' },
					// 'fixedrange' on the yAxis means that dragging is only allowed on the xAxis which we utilize for selecting dateRanges
					yaxis: { title: unitLabel, gridcolor: '#ddd', fixedrange: true },
					xaxis: { rangeslider: { visible: true }, showgrid: true, gridcolor: '#ddd' }
				}}
			/>
		);

	}
}
