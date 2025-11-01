/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { debounce } from 'lodash';
import { utc } from 'moment';
import { PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { Icons } from 'plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import { updateSliderRange } from '../redux/actions/extraActions';
import { readingsApi, stableEmptyLineReadings } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectLineChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectLineChartDeps, selectPlotlyGroupData, selectPlotlyMeterData } from '../redux/selectors/lineChartSelectors';
import { selectLineUnitLabel } from '../redux/selectors/plotlyDataSelectors';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import Locales from '../types/locales';
import { useTranslate } from '../redux/componentHooks';
import SpinnerComponent from './SpinnerComponent';
import { setInitialXAxisRange, selectSliderRangeInterval } from '../redux/slices/graphSlice';
import { fullSizeContainer } from '../styles/modalStyle';

/**
 * @returns plotlyLine graphic
 */
export default function LineChartComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	// get current data fetching arguments
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectLineChartQueryArgs);
	// get data needed to derive/ format data from query response
	const { meterDeps, groupDeps } = useAppSelector(selectLineChartDeps);
	const locale = useAppSelector(selectSelectedLanguage);
	// initial slider range
	const sliderRangeInterval = useAppSelector(selectSliderRangeInterval);

	// Fetch data, and derive plotly points
	const { data: meterPlotlyData, isFetching: meterIsFetching } = readingsApi.useLineQuery(meterArgs,
		{
			skip: meterShouldSkip,
			// Custom Data Derivation with query hook properties.
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				// use query data as selector parameter, pass in data dependencies.
				// Data may still be in transit, so pass a stable empty reference if needed for memoization.
				data: selectPlotlyMeterData(data ?? stableEmptyLineReadings, meterDeps)
			})
		});

	const { data: groupPlotlyData = stableEmptyLineReadings, isFetching: groupIsFetching } = readingsApi.useLineQuery(groupArgs,
		{
			skip: groupShouldSkip,
			selectFromResult: ({ data, ...rest }) => ({
				...rest,
				data: selectPlotlyGroupData(data ?? stableEmptyLineReadings, groupDeps)
			})
		});

	// Use Query Data to derive plotly datasets memoized selector
	const unitLabel = useAppSelector(selectLineUnitLabel);

	// Display Plotly Buttons Feature
	// The number of items in defaultButtons and advancedButtons must differ as discussed below
	const defaultButtons: Plotly.ModeBarDefaultButtons[] = ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d',
		'zoomOut2d', 'autoScale2d', 'resetScale2d'];
	const advancedButtons: Plotly.ModeBarDefaultButtons[] = ['select2d', 'lasso2d', 'autoScale2d', 'resetScale2d'];
	// Manage button states with useState
	const [listOfButtons, setListOfButtons] = React.useState(defaultButtons);

	const data: Partial<Plotly.PlotData>[] = React.useMemo(() => meterPlotlyData.concat(groupPlotlyData), [meterPlotlyData, groupPlotlyData]);
	// Getting the entire x-axis range from all traces
	// This is used to set the initial x-axis range when the component mounts.
	// It ensures that the graph starts with a range that covers all data points. That would be used for querying the data.
	// If there are no data points, minX and maxX will be undefined.
	const allX = React.useMemo(
		() =>
			data.flatMap(trace => {
				if (!trace.x) return [];
				// If trace.x is an array of arrays, flatten it
				if (Array.isArray(trace.x[0])) {
					return (trace.x as any[][]).flat();
				}
				// Otherwise, it's a flat array
				return trace.x as (string | number | Date)[];
			}),
		[data]
	);

	const minX = allX.length ? utc(allX.reduce((a, b) => utc(a).isBefore(utc(b)) ? a : b)) : undefined;
	const maxX = allX.length ? utc(allX.reduce((a, b) => utc(a).isAfter(utc(b)) ? a : b)) : undefined;

	React.useEffect(() => {
		if (minX && maxX) {
			dispatch(setInitialXAxisRange(new TimeInterval(minX, maxX)));
		}
	}, [minX, maxX]);

	if (meterIsFetching || groupIsFetching) {
		return <SpinnerComponent loading height={50} width={50} />;
	}


	// Check if there is at least one valid graph
	const enoughData = data.find(data => data.x!.length > 1);
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (data.length === 0) {
		return <h1>{`${translate('select.meter.group')}`}	</h1>;
	} else if (!enoughData) {
		return <h1>{`${translate('no.data.in.range')}`}</h1>;
	} else {
		let minDate = '';
		let maxDate = '';
		for (const trace of data) {
			if (trace.x && trace.x.length > 0) {
				const traceMin = trace.x[0] as string;
				const traceMax = trace.x[trace.x.length - 1] as string;
				// Update minX if this is the first trace or has an earlier date
				if (minDate === '' || utc(traceMin).isBefore(utc(minDate))) {
					minDate = traceMin;
				}
				// Update maxX if this is the first trace or has a later date
				if (maxDate === '' || utc(traceMax).isAfter(utc(maxDate))) {
					maxDate = traceMax;
				}
			}
		}
		// Tries to get the range from the slider range interval, undefined if not bounded
		const sliderRange: [string, string] | undefined = sliderRangeInterval?.getIsBounded() ? [sliderRangeInterval.getStartTimestamp()!.utc().toISOString(), sliderRangeInterval.getEndTimestamp()!.utc().toISOString()] : undefined;
		// Either sets the xRange to the minDate maxDate or the saved slider range. This keeps the range from resetting when we toggle error bars.
		const xRange: [string, string] = sliderRange ?? [minDate, maxDate];
		return (
			<Plot
				data={data}
				style={fullSizeContainer}
				layout={{
					margin: { t: 0, b: 0, r: 3 }, // Eliminate top, bottom, and right margins
					autosize: true, showlegend: true,
					legend: { x: 0, y: 1.1, orientation: 'h' },
					yaxis: { title: unitLabel, gridcolor: '#ddd', fixedrange: true },
					// 'fixedrange' on the yAxis means that dragging is only allowed on the xAxis which we utilize for selecting dateRanges
					xaxis: {
						rangeslider: { visible: true, range: [minDate, maxDate] },
						range: xRange,
						showgrid: true,
						gridcolor: '#ddd'
					}
				}}
				config={{
					responsive: true,
					displayModeBar: true,
					modeBarButtonsToRemove: listOfButtons,
					modeBarButtonsToAdd: [{
						name: 'toggle-options',
						title: translate('toggle.options'),
						icon: Icons.pencil,
						click: function () {
							// # of items must differ so the length can tell which list of buttons is being set
							setListOfButtons(listOfButtons.length === defaultButtons.length ? advancedButtons : defaultButtons); // Update the state
						}
					}],
					locale,
					// Available Locales
					locales: Locales
				}}
				onRelayout={debounce(
					(e: PlotRelayoutEvent) => {
						// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
						if (e['xaxis.range[0]'] && e['xaxis.range[1]']) {
							// The event signals changes in the user's interaction with the graph.
							// this will automatically trigger a refetch due to updating a query arg.
							const startTS = utc(e['xaxis.range[0]']);
							const endTS = utc(e['xaxis.range[1]']);
							const workingTimeInterval = new TimeInterval(startTS, endTS);
							dispatch(updateSliderRange(workingTimeInterval));
						}
						else if (e['xaxis.range']) {
							// this case is when the slider knobs are dragged.
							const range = e['xaxis.range']!;
							const startTS = range && range[0];
							const endTS = range && range[1];
							dispatch(updateSliderRange(new TimeInterval(utc(startTS), utc(endTS))));

						}
					}, 500, { leading: false, trailing: true })
				}
			/>
		);

	}
}
