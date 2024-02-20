import * as _ from 'lodash';
import * as moment from 'moment';
import { PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot, { Figure } from 'react-plotly.js';
import { useDebounceCallback } from 'usehooks-ts';
import { TimeInterval } from '../../../common/TimeInterval';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { changeSliderRange, selectSliderRangeInterval } from '../redux/slices/graphSlice';


export interface OEDPlotProps {
	data: Partial<Plotly.PlotData>[];
	layout: Partial<Plotly.Layout>
	config: Partial<Plotly.Config>
}

export const PlotOED = (props: OEDPlotProps) => {
	const { data, config } = props;
	const dispatch = useAppDispatch();

	// don't need value but trigger re-render when changes
	const rangeSlider = useAppSelector(selectSliderRangeInterval);

	const figure = React.useRef<Partial<Figure>>(props)
	const debouncedSliderUpdate = useDebounceCallback(
		(e: PlotRelayoutEvent) => {
			// console.log(e)
			// This event emits an object that contains values indicating changes in the user's graph, such as zooming.
			if (e['xaxis.range[0]'] && e['xaxis.range[1]']) {
				// The event signals changes in the user's interaction with the graph.
				// this will automatically trigger a refetch due to updating a query arg.
				const startTS = moment.utc(e['xaxis.range[0]'])
				const endTS = moment.utc(e['xaxis.range[1]'])
				const workingTimeInterval = new TimeInterval(startTS, endTS);
				dispatch(changeSliderRange(workingTimeInterval));
			}
			else if (e['xaxis.range']) {
				// this case is when the slider knobs are dragged.
				const range = figure.current.layout?.xaxis?.range
				const startTS = range && range[0]
				const endTS = range && range[1]
				dispatch(changeSliderRange(new TimeInterval(startTS, endTS)));

			}
		});
	const trackPlotly = (e: Figure) => {
		figure.current = { ...e }
	}

	// Get dataset wth min /max date
	const minDataset = _.minBy(data, obj => obj.x![0])
	const maxDataset = _.maxBy(data, obj => obj.x![obj.x!.length - 1])

	// Get min/ max value from dataset
	const min = minDataset?.x?.[0]
	const max = maxDataset?.x?.[maxDataset?.x?.length - 1]

	// RangeSlider's min/max value
	// if unbounded, then undefined
	const rangeSliderMin = rangeSlider.getStartTimestamp()?.utc().toDate()
	const rangeSliderMax = rangeSlider.getEndTimestamp()?.utc().toDate()

	// Use rangeSlider if not unbounded else min/max
	const start = rangeSliderMin ?? min
	const end = rangeSliderMax ?? max
	console.log(figure.current)
	return <Plot style={{ width: '100%', height: '100%' }}
		data={data}
		config={config}
		onRelayout={debouncedSliderUpdate}
		onUpdate={trackPlotly}
		useResizeHandler
		layout={{
			...figure.current.layout,
			xaxis: {
				...figure.current.layout?.xaxis,
				range: [start, end]
			}
		}}
	// onHover={e => console.log(e)}
	/>
}