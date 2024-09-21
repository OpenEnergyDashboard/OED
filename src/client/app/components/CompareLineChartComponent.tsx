/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { debounce } from 'lodash';
import { utc } from 'moment';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import { updateSliderRange } from '../redux/actions/extraActions';
import { readingsApi, stableEmptyLineReadings } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectCompareLineQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectLineUnitLabel } from '../redux/selectors/plotlyDataSelectors';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import Locales from '../types/locales';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';
import { selectGraphState, selectShiftAmount, selectShiftTimeInterval, updateShiftTimeInterval } from '../redux/slices/graphSlice';
import ThreeDPillComponent from './ThreeDPillComponent';
import { selectThreeDComponentInfo } from '../redux/selectors/threeDSelectors';
import { selectPlotlyGroupData, selectPlotlyMeterData } from '../redux/selectors/lineChartSelectors';
import { MeterOrGroup, ShiftAmount } from '../types/redux/graph';
import { PlotRelayoutEvent } from 'plotly.js';
import { shiftDateFunc } from './CompareLineControlsComponent';
/**
 * @returns plotlyLine graphic
 */
export default function CompareLineChartComponent() {
	const dispatch = useAppDispatch();
	const graphState = useAppSelector(selectGraphState);
	const meterOrGroupID = useAppSelector(selectThreeDComponentInfo).meterOrGroupID;
	const unitLabel = useAppSelector(selectLineUnitLabel);
	const locale = useAppSelector(selectSelectedLanguage);
	const shiftInterval = useAppSelector(selectShiftTimeInterval);
	const shiftAmount = useAppSelector(selectShiftAmount);
	const { args, shouldSkipQuery, argsDeps } = useAppSelector(selectCompareLineQueryArgs);

	// getting the time interval of current data
	const timeInterval = graphState.queryTimeInterval;

	// Storing the time interval strings for the original data and the shifted data to use for range in plot
	const [timeIntervalStr, setTimeIntervalStr] = React.useState(['', '']);
	const [shiftIntervalStr, setShiftIntervalStr] = React.useState(['', '']);

	// Fetch original data, and derive plotly points
	const { data, isFetching } = graphState.threeD.meterOrGroup === MeterOrGroup.meters ?
		readingsApi.useLineQuery(args,
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyMeterData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			})
		:
		readingsApi.useLineQuery(args,
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyGroupData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			});

	// Callback function to update the shifted interval based on current interval and shift amount
	const updateShiftedInterval = React.useCallback((start: moment.Moment, end: moment.Moment, shift: ShiftAmount) => {
		const { shiftedStart, shiftedEnd } = shiftDateFunc(start, end, shift);
		const newShiftedInterval = new TimeInterval(shiftedStart, shiftedEnd);
		dispatch(updateShiftTimeInterval(newShiftedInterval));
	}, [dispatch]);

	// Update shifted interval based on current interval and shift amount
	React.useEffect(() => {
		const startDate = timeInterval.getStartTimestamp();
		const endDate = timeInterval.getEndTimestamp();

		if (startDate && endDate) {
			setTimeIntervalStr([startDate.toISOString(), endDate.toISOString()]);

			if (shiftAmount !== ShiftAmount.none && shiftAmount !== ShiftAmount.custom) {
				updateShiftedInterval(startDate, endDate, shiftAmount);
			}
		}
	}, [timeInterval, shiftAmount, updateShiftedInterval]);

	// Update shift interval string based on shift interval or time interval
	React.useEffect(() => {
		const shiftStart = shiftInterval.getStartTimestamp();
		const shiftEnd = shiftInterval.getEndTimestamp();

		if (shiftStart && shiftEnd) {
			setShiftIntervalStr([shiftStart.toISOString(), shiftEnd.toISOString()]);
		} else {
			// If shift interval is not set, use the original time interval
			const startDate = timeInterval.getStartTimestamp();
			const endDate = timeInterval.getEndTimestamp();
			if (startDate && endDate) {
				setShiftIntervalStr([startDate.toISOString(), endDate.toISOString()]);
			}
		}
	}, [shiftInterval, timeInterval]);

	// Getting the shifted data
	const { data: dataNew, isFetching: isFetchingNew } = graphState.threeD.meterOrGroup === MeterOrGroup.meters ?
		readingsApi.useLineQuery({ ...args, timeInterval: shiftInterval.toString() },
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyMeterData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			})
		:
		readingsApi.useLineQuery({ ...args, timeInterval: shiftInterval.toString() },
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyGroupData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			});

	if (isFetching || isFetchingNew) {
		return <SpinnerComponent loading height={50} width={50} />;
	}

	// Check if there is at least one valid graph for current data and shifted data
	const enoughData = data.find(data => data.x!.length > 1);
	const enoughNewData = dataNew.find(dataNew => dataNew.x!.length > 1);

	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text `not plot.
	if (!graphState.threeD.meterOrGroup && (data.length === 0 || dataNew.length === 0)) {
		return <><ThreeDPillComponent /><h1>{`${translate('select.meter.group')}`}</h1></>;
	} else if (!enoughData || !enoughNewData) {
		return <><ThreeDPillComponent /><h1>{`${translate('no.data.in.range')}`}</h1></>;
	} else if (!timeInterval.getIsBounded()) {
		return <><ThreeDPillComponent /><h1>{`${translate('please.set.the.date.range')}`}</h1></>;
	} else {
		// adding information to the shifted data so that it can be plotted on the same graph with current data
		const updateDataNew = dataNew.map(item => ({
			...item,
			name: 'Shifted ' + item.name,
			line: { ...item.line, color: '#1AA5F0' },
			xaxis: 'x2',
			text: Array.isArray(item.text)
				? item.text.map(text => text.replace('<br>', '<br>Shifted '))
				: item.text?.replace('<br>', '<br>Shifted ')
		}));

		return (
			<>
				<ThreeDPillComponent />
				<Plot
					// only plot shifted data if the shiftAmount has been chosen
					data={shiftAmount === ShiftAmount.none ? [...data] : [...data, ...updateDataNew]}
					style={{ width: '100%', height: '100%', minHeight: '750px' }}
					layout={{
						autosize: true, showlegend: true,
						legend: { x: 0, y: 1.1, orientation: 'h' },
						// 'fixedrange' on the yAxis means that dragging is only allowed on the xAxis which we utilize for selecting dateRanges
						yaxis: { title: unitLabel, gridcolor: '#ddd', fixedrange: true },
						xaxis: {
							rangeslider: { visible: true },
							// Set range for x-axis based on timeIntervalStr so that current data and shifted data is aligned
							range: timeIntervalStr.length === 2 ? timeIntervalStr : undefined
						},
						xaxis2: {
							titlefont: { color: '#1AA5F0' },
							tickfont: { color: '#1AA5F0' },
							overlaying: 'x',
							side: 'top',
							// Set range for x-axis2 based on shiftIntervalStr so that current data and shifted data is aligned
							range: shiftIntervalStr.length === 2 ? shiftIntervalStr : undefined
						}
					}}
					config={{
						responsive: true,
						displayModeBar: false,
						// Current Locale
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
			</>

		);

	}
}
