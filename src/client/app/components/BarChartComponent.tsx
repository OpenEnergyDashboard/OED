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
import { selectPlotlyBarDataFromResult, selectPlotlyBarDeps } from '../redux/selectors/barChartSelectors';
import { selectBarChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectBarUnitLabel, selectIsRaw } from '../redux/selectors/plotlyDataSelectors';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { graphSlice, selectBarStacking } from '../redux/slices/graphSlice';
import locales from '../types/locales';
import { BarReadings } from '../types/readings';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';

const stableEmptyData: BarReadings = {}
/**
 * Passes the current redux state of the barchart, and turns it into props for the React
 * component, which is what will be visible on the page. Makes it possible to access
 * your reducer state objects from within your React components.
 * @returns Plotly BarChart
 */
export default function BarChartComponent() {
	const dispatch = useAppDispatch();
	const { barMeterDeps, barGroupDeps } = useAppSelector(selectPlotlyBarDeps);
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectBarChartQueryArgs);
	const { data: meterReadings, isLoading: meterIsFetching } = readingsApi.useBarQuery(meterArgs, {
		skip: meterShouldSkip,
		selectFromResult: ({ data, ...rest }) => ({
			...rest,
			data: selectPlotlyBarDataFromResult(data ?? stableEmptyData, barMeterDeps)
		})
	});

	const { data: groupData, isLoading: groupIsFetching } = readingsApi.useBarQuery(groupArgs, {
		skip: groupShouldSkip,
		selectFromResult: ({ data, ...rest }) => ({
			...rest,
			data: selectPlotlyBarDataFromResult(data ?? stableEmptyData, barGroupDeps)
		})
	});

	const barStacking = useAppSelector(selectBarStacking);
	// The unit label depends on the unit which is in selectUnit state.
	const raw = useAppSelector(selectIsRaw);
	const unitLabel = useAppSelector(selectBarUnitLabel);
	const locale = useAppSelector(selectSelectedLanguage);


	// useQueryHooks for data fetching
	const datasets: Partial<Plotly.PlotData>[] = meterReadings.concat(groupData);

	if (meterIsFetching || groupIsFetching) {
		return <SpinnerComponent loading width={50} height={50} />;
	}

	const handleRelayout = (e: PlotRelayoutEvent) => {
		// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
		// These values indicate when the user has zoomed or made other changes to the graph.
		if (e['xaxis.range[0]'] && e['xaxis.range[0]']) {
			// The event signals changes in the user's interaction with the graph.
			// this will automatically trigger a refetch due to updating a query arg.
			const startTS = moment.utc(e['xaxis.range[0]']);
			const endTS = moment.utc(e['xaxis.range[1]']);
			const workingTimeInterval = new TimeInterval(startTS, endTS);
			dispatch(graphSlice.actions.updateTimeInterval(workingTimeInterval));
		}
	}

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true (not for bar charts)

	if (raw) {
		return <h1><b>${translate('bar.raw')}</b></h1>;
	}
	// At least one viable dataset.
	const enoughData = datasets.find(dataset => dataset.x!.length > 1);

	if (datasets.length === 0) {
		return <h1>
			{`${translate('select.meter.group')}`}
		</h1>;
	} else if (!enoughData) {
		return <h1>{`${translate('no.data.in.range')}`}</h1>;
	} else {
		return (
			<Plot
				data={datasets}
				style={{ width: '100%', height: '100%' }}
				onRelayout={handleRelayout}
				useResizeHandler={true}
				config={{
					displayModeBar: false,
					responsive: true,
					locale,
					locales
				}}
				layout={{
					barmode: (barStacking ? 'stack' : 'group'),
					bargap: 0.2, // Gap between different times of readings
					bargroupgap: 0.1, // Gap between different meter's readings under the same timestamp
					showlegend: true,
					legend: { x: 0, y: 1.1, orientation: 'h' },
					yaxis: {
						title: unitLabel, showgrid: true,
						gridcolor: '#ddd', fixedrange: true
					},
					xaxis: {
						rangeslider: { visible: true },
						// rangeselector: { visible: true },
						showgrid: true, gridcolor: '#ddd',
						tickangle: -45, autotick: true,
						nticks: 10,
						tickfont: { size: 10 }
					}
				}}
			/>
		);
	}
}
