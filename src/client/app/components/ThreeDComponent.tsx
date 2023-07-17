import * as React from 'react';
import * as moment from 'moment';
import Plot from 'react-plotly.js';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
import { ThreeDReading } from '../types/readings'
import { TimeInterval } from '../../../common/TimeInterval';
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
const layout = {
	autosize: true,
	showlegend: true,
	height: 700,
	scene: {
		xaxis: {
			title: 'Hours of Day',
			tickformat: '%I:%M %p'
			// tickformat: '%X' default locale formatting
			// nticks: 4 auto works fine.
		},
		yaxis: {
			title: 'Days of Calendar Year',
			tickformat: '%x' // Locale aware date formatting.
			// nticks: 6
		},
		zaxis: { title: 'Resource Usage' },
		camera: {
			// Somewhat suitable camera eye values for data of zResource[day][hour]
			eye: {
				x: 2, // Adjust x value for zoom
				y: -1.25, // Adjust y value for zoom
				z: 0.1 // Adjust z value for zoom
			}
		}
	}
};
const config = {
	responsive: true
};
/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	const dataToRender = useSelector((state: State) => {
		const selectedMeterID = state.graph.selectedMeters[0];

		// No Meter Selected => undefined => falsy
		if (!selectedMeterID || state.readings.threeD.isFetching) {
			return null;
		}
		// const timeInterval = state.graph.timeInterval.toString();
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();
		const unitID = state.graph.selectedUnit;
		const precision = state.graph.threeDAxisPrecision;
		const meterThreeDReadings = state.readings.threeD.byMeterID?.[selectedMeterID]?.[timeInterval]?.[unitID]?.[precision]?.readings;
		if (!meterThreeDReadings) {
			return null;
		}
		return formatThreeDData(meterThreeDReadings);
	});

	return (
		<Plot data={dataToRender} layout={layout} config={config} />
	);
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading): Array<object> {
	return [{
		type: 'surface',
		x: data.xData.map(xData => moment.utc(xData).format()),
		y: data.yData.map(yData => moment.utc(yData).format()),
		z: data.zData,
		hoverinfo: 'text',
		hovertext: data.zData.map((day, i) => day.map((readings, j) => //TODO format hover-text based on locale
			`Date: ${moment.utc(data.yData[i]).format('MMM DD, YYYY')}<br>Time: ${moment.utc(data.xData[j]).format('h:mm A')}<br>Usage: ${readings}`))
	}]
}

/**
 * Determines if Time Interval is valid for 3d graphic. Is bounded, and a year or less.
 * @param timeInterval - current redux state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
export function isValidThreeDInterval(timeInterval: TimeInterval): boolean {
	return (timeInterval.getIsBounded() && timeInterval.duration('days') <= 365) ? true : false;
}
