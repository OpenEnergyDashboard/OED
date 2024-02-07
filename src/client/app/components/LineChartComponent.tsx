/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectLineChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectLineChartDeps, selectPlotlyGroupData, selectPlotlyMeterData, selectPlotlyUnitLabel } from '../redux/selectors/lineChartSelectors';
import { graphSlice } from '../redux/slices/graphSlice';
import { LineReadings } from '../types/readings';
import translate from '../utils/translate';
import LogoSpinner from './LogoSpinner';

// Stable reference for when there is not data.
const stableEmptyReadings: LineReadings = {}
/**
 * @returns plotlyLine graphic
 */
export default function LineChartComponent() {
	const dispatch = useAppDispatch();
	// get current data fetching arguments
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectLineChartQueryArgs)
	// get data needed to derive/ format data from query response
	const { plotlyMeterDeps, plotlyGroupDeps } = useAppSelector(selectLineChartDeps)

	// Fetch data, and derive plotly points
	const { data: meterPlotlyData, isLoading: meterIsLoading } = readingsApi.useLineQuery(meterArgs,
		{
			skip: meterShouldSkip,
			// Custom Data Derivation with query hook properties.
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				// use query data as selector parameter, pass in data dependencies.
				// Data may still be in transit, so pass a stable empty reference if needed for memoization.
				data: selectPlotlyMeterData(data ?? stableEmptyReadings, plotlyMeterDeps)
			})
		});

	const { data: groupPlotlyData = stableEmptyReadings, isLoading: groupIsLoading } = readingsApi.useLineQuery(groupArgs,
		{
			skip: groupShouldSkip,
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				data: selectPlotlyGroupData(data ?? stableEmptyReadings, plotlyGroupDeps)
			})
		});

	// Use Query Data to derive plotly datasets memoized selector
	const unitLabel = useAppSelector(selectPlotlyUnitLabel)

	const datasets: Partial<Plotly.PlotData>[] = meterPlotlyData.concat(groupPlotlyData);
	if (meterIsLoading || groupIsLoading) {
		return <LogoSpinner />
		// return <SpinnerComponent loading width={50} height={50} />
	}

	const handleRelayout = (e: PlotRelayoutEvent) => {
		// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
		// These values indicate when the user has zoomed or made other changes to the graph.
		if (e['xaxis.range[0]'] && e['xaxis.range[0]']) {
			// The event signals changes in the user's interaction with the graph.
			// this will automatically trigger a refetch due to updating a query arg.
			const startTS = moment.utc(e['xaxis.range[0]'])
			const endTS = moment.utc(e['xaxis.range[1]'])
			const workingTimeInterval = new TimeInterval(startTS, endTS);
			dispatch(graphSlice.actions.updateTimeInterval(workingTimeInterval));
		}
	}
	// Check if there is at least one valid graph
	const ableToGraph = datasets.find(data => data.x!.length > 1)
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (datasets.length === 0) {
		return <h1>{`${translate('select.meter.group')}`}	</h1>
	} else if (!ableToGraph) {
		// This normal so plot.
		return <h1>{`${translate('threeD.no.data')}`}</h1>
	} else {
		return (
			<Plot
				data={datasets as Plotly.Data[]}
				onRelayout={handleRelayout}
				style={{ width: '100%', height: '100%' }}
				useResizeHandler={true}
				config={{
					responsive: true,
					displayModeBar: false
				}}
				layout={{
					autosize: true, showlegend: true,
					legend: { x: 0, y: 1.1, orientation: 'h' },
					// 'fixedrange' on the yAxis means that dragging is only allowed on the xAxis which we utilize for selecting dateRanges
					yaxis: { title: unitLabel, gridcolor: '#ddd', fixedrange: true },
					xaxis: {
						rangeslider: { visible: true },
						showgrid: true, gridcolor: '#ddd'
					}
				}}
			/>
		)

	}
}


/**
 * Determines the line graph's slider interval based after the slider is moved
 * @returns The slider interval, either 'all' or a TimeInterval
 */
export function getRangeSliderInterval(): string {
	const sliderContainer: any = document.querySelector('.rangeslider-bg');
	const sliderBox: any = document.querySelector('.rangeslider-slidebox');
	const root: any = document.getElementById('root');

	if (sliderContainer && sliderBox && root) {
		// Attributes of the slider: full width and the min & max values of the box
		const fullWidth: number = parseInt(sliderContainer.getAttribute('width'));
		const sliderMinX: number = parseInt(sliderBox.getAttribute('x'));
		const sliderMaxX: number = sliderMinX + parseInt(sliderBox.getAttribute('width'));
		if (sliderMaxX - sliderMinX === fullWidth) {
			return 'all';
		}

		// From the Plotly line graph, get current min and max times in seconds
		const minTimeStamp: number = parseInt(root.getAttribute('min-timestamp'));
		const maxTimeStamp: number = parseInt(root.getAttribute('max-timestamp'));

		// Seconds displayed on graph
		const deltaSeconds: number = maxTimeStamp - minTimeStamp;
		const secondsPerPixel: number = deltaSeconds / fullWidth;

		// Get the new min and max times, in seconds, from the slider box
		const newMinXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMinX));
		const newMaxXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMaxX));
		// The newMin/MaxTimestamp is equivalent to a Unix time in milliseconds. Thus, it will
		// shift with timezone. It isn't clear if we want it in local or UTC. It depends on what
		// plotly does. Here it is assumed that local is what is desired. This seems to work
		// and not shift the graphs x-axis so using.
		return new TimeInterval(moment(newMinXTimestamp), moment(newMaxXTimestamp)).toString();
	} else {
		throw new Error('unable to get range slider params');
	}
}