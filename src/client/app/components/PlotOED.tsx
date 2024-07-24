/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { debounce, minBy, maxBy } from 'lodash';
import * as moment from 'moment';
import { Datum, PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot, { Figure, PlotParams } from 'react-plotly.js';
import { TimeInterval } from '../../../common/TimeInterval';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { changeSliderRange, selectPlotlySliderMax, selectPlotlySliderMin } from '../redux/slices/graphSlice';



export interface OEDPlotProps {
	data: Partial<Plotly.PlotData>[];
	layout: Partial<Plotly.Layout>;
	config?: Partial<Plotly.Config>;
	frames?: Plotly.Frame[] | undefined;

}

export const PlotOED = (props: OEDPlotProps) => {
	const { data } = props;
	const dispatch = useAppDispatch();

	// Current Range Slider. Controls Zoom for graphics.
	const rangeSliderMin = useAppSelector(selectPlotlySliderMin);
	const rangeSliderMax = useAppSelector(selectPlotlySliderMax);
	const locale = useAppSelector(selectSelectedLanguage);

	// Local State for plotly
	const figure = React.useRef<Partial<PlotParams>>(props);

	// Debounce to limit dispatch and keep reasonable history
	const debouncedRelayout = debounce(
		(e: PlotRelayoutEvent) => {
			// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
			if (e['xaxis.range[0]'] && e['xaxis.range[1]']) {
				// The event signals changes in the user's interaction with the graph.
				// this will automatically trigger a refetch due to updating a query arg.
				const startTS = moment.utc(e['xaxis.range[0]']);
				const endTS = moment.utc(e['xaxis.range[1]']);
				const workingTimeInterval = new TimeInterval(startTS, endTS);
				dispatch(changeSliderRange(workingTimeInterval));
			}
			else if (e['xaxis.range']) {
				// this case is when the slider knobs are dragged.
				const range = figure.current.layout?.xaxis?.range;
				const startTS = range && range[0];
				const endTS = range && range[1];
				dispatch(changeSliderRange(new TimeInterval(startTS, endTS)));

			}
		}, 500, { leading: false, trailing: true });

	// Save plotly state as ref. Not using state which would cause excessive re-renders
	const trackPlotly = (e: Figure) => {
		figure.current = {
			...figure.current,
			...e
		} as PlotParams;
	};

	// Iterating through datasets may be expensive, so useMemo()
	// Get dataset wth min /max date
	const minRange = React.useMemo(() => {
		const minDataset = minBy(data, obj => obj.x![0]);
		const min = minDataset?.x?.[0];
		return min as Datum;
	}, [props.data]);

	// Get min/ max value from dataset
	const maxRange = React.useMemo(() => {
		const maxDataset = maxBy(data, obj => obj.x![obj.x!.length - 1]);
		const max = maxDataset?.x?.[maxDataset?.x?.length - 1] as Datum;
		return max as Datum;
	}, [props.data]);

	// Use rangeSlider when bounded, else use min/maxRange
	const start = rangeSliderMin ?? minRange;
	const end = rangeSliderMax ?? maxRange;

	return (
		<Plot style={{ width: '100%', height: '100%', minHeight: '700px' }}
			data={props.data}
			onRelayout={debouncedRelayout}
			onUpdate={trackPlotly}
			useResizeHandler
			config={{
				responsive: true,
				displayModeBar: false,
				// Current Locale
				locale,
				// Available Locales
				// Locales: locales,
				// Buggy Behavior with current architecture, so doubleClick  disabled in favor of custom expand ui.
				doubleClick: false,
				...props.config
			}}
			layout={{
				// useProps Layout first, if any
				...props.layout,
				// then overwrite with current, if any
				// figure takes priority, as values are added throughout user interactions.
				...figure.current.layout,
				xaxis: {
					...figure.current.layout?.xaxis,
					// rangeslider: range of min and max reading dates (queryInterval())
					rangeslider: {
						...figure.current.layout?.xaxis?.rangeslider,
						range: [minRange, maxRange]
					},
					// xaxis.range: Current position of slider knobs. A subSet of range-slider.range
					range: [start, end]
				}
			}}
		/>
	);
};
