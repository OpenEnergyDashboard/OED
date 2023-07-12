import * as React from 'react';
import Plot from 'react-plotly.js';
import { State } from '../types/redux/state';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { ThreeDReading } from '../types/readings'
import { Dispatch } from 'types/redux/actions';
import { fetchNeededThreeDReadings } from '../actions/threeDReadings';
import { TimeInterval } from '../../../common/TimeInterval';
const layout = {
	autosize: true,
	showlegend: true,
	height: 700,
	scene: {
		xaxis: {
			title: 'Hours of Day',
			nticks: 4
		},
		yaxis: {
			title: 'Days of Calendar Year',
			nticks: 6
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
	const allThreeDReadings = useSelector((state: State) => state.readings.threeD);
	const graphState = useSelector((state: State) => state.graph);
	const [threeDData, setThreeDData] = useState<any>(null);
	const dispatch: Dispatch = useDispatch();

	useEffect(() => {
		// no selected meters
		console.log('GSUE END >>>>');
		if (graphState.selectedMeters.length < 1) return;
		const selectedMeterID = graphState.selectedMeters[0];
		const timeInterval = graphState.timeInterval;
		if (isValidThreeDInterval(timeInterval)) {
			console.log('Valid Time Interval, Fetching!');
			dispatch(fetchNeededThreeDReadings(selectedMeterID));
		}
		else
			setThreeDData(null);
		console.log(threeDData);
		console.log('GSUE END <<<<');
	}, [graphState.selectedMeters]); //Fetch on Selected Meter Change

	useEffect(() => {
		console.log('ATDR START >>>>');
		// no selected meters
		if (graphState.selectedMeters.length < 1) return;
		const selectedMeterID = graphState.selectedMeters[0];
		const timeInterval = graphState.timeInterval.toString();
		const unitID = graphState.selectedUnit;
		const precision = graphState.threeDAxisPrecision;
		console.log(allThreeDReadings);
		// Check if Readings Exist In State
		if (allThreeDReadings.byMeterID[selectedMeterID]) {
			console.log('Meter Data Exists.');
			const data = allThreeDReadings.byMeterID[selectedMeterID][timeInterval][unitID][precision].readings;
			if (data) setThreeDData(formatThreeDData(data));
			else setThreeDData(null);
		}

		console.log(threeDData);
		console.log('ATDR END <<<<');

	}, [allThreeDReadings]);

	return (
		<div>
			{
				threeDData !== null ?
					(<Plot data={threeDData} layout={layout} config={config} />)
					:
					(<p>No Data Yet!</p>)
			}
		</div>
	);
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading): any {
	// TODO FIX RETURN TYPE
	return [{
		type: 'surface',
		x: data.xData,
		y: data.yData,
		z: data.zData,
		hoverinfo: 'text',
		hovertext: data.zData.map(
			(day, i) => day.map(
				(readings, j) => `Date: ${data.yData[i]}<br>Time: ${data.xData[j]}<br>Usage: ${readings}`))
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
