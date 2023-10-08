/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { Datum, PlotRelayoutEvent } from 'plotly.js';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { Button } from 'reactstrap';
import { TimeInterval } from '../../../common/TimeInterval';
import { graphSlice } from '../reducers/graph';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
	ChartQueryProps, LineReadingApiArgs,
	selectGroupDataByID, selectMeterDataByID,
	selectMeterState, selectUnitDataById
} from '../redux/selectors/dataSelectors';
import { selectSelectedGroups, selectSelectedMeters } from '../redux/selectors/uiSelectors';
import { DataType } from '../types/Datasources';
import Locales from '../types/locales';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import getGraphColor from '../utils/getGraphColor';
import { lineUnitLabel } from '../utils/graphics';
import translate from '../utils/translate';
import LogoSpinner from './LogoSpinner';
import TooltipMarkerComponent from './TooltipMarkerComponent';


/**
 * @param props qpi query
 * @returns plotlyLine graphic
 */
export default function LineChartComponent(props: ChartQueryProps<LineReadingApiArgs>) {
	const { meterArgs, groupsArgs } = props.queryProps;
	const dispatch = useAppDispatch();
	const {
		data: meterReadings,
		isFetching: meterIsFetching
	} = readingsApi.useLineQuery(meterArgs, { skip: !meterArgs.ids.length });

	const {
		data: groupData,
		isFetching: groupIsFetching
	} = readingsApi.useLineQuery(groupsArgs, { skip: !groupsArgs.ids.length });

	const selectedUnit = useAppSelector(state => state.graph.selectedUnit);
	const datasets: any[] = [];
	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = useAppSelector(state => state.graph.selectedUnit);
	// The current selected rate
	const currentSelectedRate = useAppSelector(state => state.graph.lineGraphRate);
	const timeInterval = useAppSelector(state => state.graph.timeInterval);
	const unitDataByID = useAppSelector(state => selectUnitDataById(state));
	const selectedAreaNormalization = useAppSelector(state => state.graph.areaNormalization);
	const selectedAreaUnit = useAppSelector(state => state.graph.selectedAreaUnit);
	const selectedMeters = useAppSelector(state => selectSelectedMeters(state));
	const selectedGroups = useAppSelector(state => selectSelectedGroups(state));
	const metersState = useAppSelector(state => selectMeterState(state));
	const meterDataByID = useAppSelector(state => selectMeterDataByID(state));
	const groupDataByID = useAppSelector(state => selectGroupDataByID(state));
	// Keeps Track of the Slider Values
	const startTsRef = React.useRef<Datum>(null);
	const endTsRef = React.useRef<Datum>(null);

	if (meterIsFetching || groupIsFetching) {
		return <LogoSpinner />
		// return <SpinnerComponent loading width={50} height={50} />
	}

	const handleRelayout = (e: PlotRelayoutEvent) => {
		// Relayout emits many kinds of events listen for the two that give the slider range changes.
		if (e['xaxis.range']) {
			startTsRef.current = e['xaxis.range'][0];
			endTsRef.current = e['xaxis.range'][1];
		} else if (e['xaxis.range[0]'] && e['xaxis.range[1]']) {
			startTsRef.current = e['xaxis.range[0]'];
			endTsRef.current = e['xaxis.range[1]'];
		}
	}


	const getTimeIntervalFromRefs = () => {
		if (!startTsRef.current && !endTsRef.current) {
			return TimeInterval.unbounded();
		} else {
			return new TimeInterval(
				moment.utc(startTsRef.current),
				moment.utc(endTsRef.current)
			)
		}
	}
	// The unit label depends on the unit which is in selectUnit state.
	// The current selected rate
	let unitLabel = '';
	let needsRateScaling = false;
	// variables to determine the slider min and max
	let minTimestamp: number | undefined;
	let maxTimestamp: number | undefined;
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		const selectUnitState = unitDataByID[selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, selectedAreaNormalization, selectedAreaUnit);
			unitLabel = returned.unitLabel
			needsRateScaling = returned.needsRateScaling;
		}
	}
	// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
	const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;
	// Add all valid data from existing meters to the line plot
	for (const meterID of selectedMeters) {
		const byMeterID = meterReadings
		// Make sure have the meter data. If you already have the meter, unselect, change
		// the timeInterval via another meter and then reselect then this new timeInterval
		// may not yet be in state so verify with the second condition on the if.
		// Note the second part may not be used based on next checks but do here since simple.
		if (byMeterID) {
			const meterArea = metersState.byMeterID[meterID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!selectedAreaNormalization || (meterArea > 0 && meterDataByID[meterID].areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = selectedAreaNormalization ? meterArea * getAreaUnitConversion(meterDataByID[meterID].areaUnit, selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				const readingsData = meterReadings[meterID]
				if (readingsData !== undefined && !meterIsFetching) {
					const label = meterDataByID[meterID].identifier;
					const colorID = meterID;
					if (readingsData === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the line readings
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData);
					readings.forEach(reading => {
						// As usual, we want to interpret the readings in UTC. We lose the timezone as this as the start/endTimestamp
						// are equivalent to Unix timestamp in milliseconds.
						const st = moment.utc(reading.startTimestamp);
						// Time reading is in the middle of the start and end timestamp
						const timeReading = st.add(moment.utc(reading.endTimestamp).diff(st) / 2);
						xData.push(timeReading.format('YYYY-MM-DD HH:mm:ss'));
						const readingValue = reading.reading * scaling;
						yData.push(readingValue);
						hoverText.push(`<b> ${timeReading.format('ddd, ll LTS')} </b> <br> ${label}: ${readingValue.toPrecision(6)} ${unitLabel}`);
					});

					/*
					get the min and max timestamp of the meter, and compare it to the global values
					TODO: If we know the interval and frequency of meter data, these calculations should be able to be simplified
					*/
					if (readings.length > 0) {
						if (minTimestamp == undefined || readings[0]['startTimestamp'] < minTimestamp) {
							minTimestamp = readings[0]['startTimestamp'];
						}
						if (maxTimestamp == undefined || readings[readings.length - 1]['endTimestamp'] >= maxTimestamp) {
							// Need to add one extra reading interval to avoid range truncation. The max bound seems to be treated as non-inclusive
							maxTimestamp = readings[readings.length - 1]['endTimestamp'] + (readings[0]['endTimestamp'] - readings[0]['startTimestamp']);
						}
					}

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
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
							color: getGraphColor(colorID, DataType.Meter)
						}
					});
				}
			}
		}
	}

	// TODO The meters and groups code is very similar and maybe it should be refactored out to create a function to do
	// both. This would mean future changes would automatically happen to both.
	// Add all valid data from existing groups to the line plot
	for (const groupID of selectedGroups) {
		const byGroupID = groupData
		// Make sure have the group data. If you already have the group, unselect, change
		// the timeInterval via another meter and then reselect then this new timeInterval
		// may not yet be in state so verify with the second condition on the if.
		// Note the second part may not be used based on next checks but do here since simple.
		if (byGroupID) {
			const groupArea = groupDataByID[groupID].area;
			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!selectedAreaNormalization || (groupArea > 0 && groupDataByID[groupID].areaUnit != AreaUnitType.none)) {
				// Convert the group area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = selectedAreaNormalization ?
					groupArea * getAreaUnitConversion(groupDataByID[groupID].areaUnit, selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				const readingsData = byGroupID[groupID];
				if (readingsData !== undefined && !groupIsFetching) {
					const label = groupDataByID[groupID].name;
					const colorID = groupID;
					if (readingsData === undefined) {
						throw new Error('Unacceptable condition: readingsData.readings is undefined.');
					}

					// Create two arrays for the x and y values. Fill the array with the data from the line readings
					const xData: string[] = [];
					const yData: number[] = [];
					const hoverText: string[] = [];
					const readings = _.values(readingsData);
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

					// get the min and max timestamp of the group, and compare it to the global values
					if (readings.length > 0) {
						if (minTimestamp == undefined || readings[0]['startTimestamp'] < minTimestamp) {
							minTimestamp = readings[0]['startTimestamp'];
						}
						if (maxTimestamp == undefined || readings[readings.length - 1]['endTimestamp'] >= maxTimestamp) {
							// Need to add one extra reading interval to avoid range truncation. The max bound seems to be treated as non-inclusive
							maxTimestamp = readings[readings.length - 1]['endTimestamp'] + (readings[0]['endTimestamp'] - readings[0]['startTimestamp']);
						}
					}

					// This variable contains all the elements (x and y values, line type, etc.) assigned to the data parameter of the Plotly object
					datasets.push({
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
			}
		}
	}

	// set the bounds for the slider
	if (minTimestamp == undefined) {
		minTimestamp = 0;
		maxTimestamp = 0;
	}
	const root: any = document.getElementById('root');
	root.setAttribute('min-timestamp', minTimestamp);
	root.setAttribute('max-timestamp', maxTimestamp);

	// Use the min/max time found for the readings (and shifted as desired) as the
	// x-axis range for the graph.
	// Avoid pesky shifting timezones with utc.
	const start = moment.utc(minTimestamp).toISOString();
	const end = moment.utc(maxTimestamp).toISOString();

	let layout: any;
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	if (datasets.length === 0) {
		// There is not data so tell user.
		layout = {
			'xaxis': {
				'visible': false
			},
			'yaxis': {
				'visible': false
			},
			'annotations': [
				{
					'text': `${translate('select.meter.group')}`,
					'xref': 'paper',
					'yref': 'paper',
					'showarrow': false,
					'font': {
						'size': 28
					}
				}
			]
		}

	} else {
		// This normal so plot.
		layout = {
			autosize: true,
			showlegend: true,
			height: 700,
			legend: {
				x: 0,
				y: 1.1,
				orientation: 'h'
			},
			yaxis: {
				title: unitLabel,
				gridcolor: '#ddd'
			},

			xaxis: {
				range: [start, end], // Specifies the start and end points of visible part of graph
				rangeslider: {
					thickness: 0.1
				},
				showgrid: true,
				gridcolor: '#ddd'
			},
			margin: {
				t: 10,
				b: 10
			}
		};
	}
	const config = {
		displayModeBar: true,
		responsive: true,
		locales: Locales // makes locales available for use
	}
	return (
		<div>
			<Plot
				data={datasets as Plotly.Data[]}
				layout={layout as Plotly.Layout}
				onInitialized={e => console.log(e.layout.xaxis?.range, e.layout.xaxis?.rangeslider?.range, e.layout.xaxis?.rangeselector)}
				onUpdate={e => console.log(e.layout.xaxis?.range, e.layout.xaxis?.rangeslider?.range, e.layout.xaxis?.rangeselector)}
				onRelayout={handleRelayout}
				config={config}
				style={{ width: '100%', height: '80%' }}
				useResizeHandler={true}
			/>
			{/*  Only Show if there's data */
				(datasets.length !== 0) &&
				<>
					<Button
						key={1}
						style={buttonMargin}
						onClick={() => dispatch(graphSlice.actions.changeGraphZoom(getTimeIntervalFromRefs()))}

					> {translate('redraw')}
					</Button>
					<Button
						key={2}
						style={buttonMargin}
						onClick={() => {
							if (!timeInterval.equals(TimeInterval.unbounded())) {
								dispatch(graphSlice.actions.changeGraphZoom(TimeInterval.unbounded()))
							}
						}}
					> {translate('restore')}
					</Button>
					<TooltipMarkerComponent
						key={3}
						page='home'
						helpTextId='help.home.chart.redraw.restore'
					/>
				</>}
		</div>
	)
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


const buttonMargin: React.CSSProperties = {
	marginRight: '10px'
};