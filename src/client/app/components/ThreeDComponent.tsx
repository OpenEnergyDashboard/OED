import * as React from 'react';
import Plot from 'react-plotly.js';
import * as moment from 'moment';
import { readingsApi } from '../utils/api';
import { TimeInterval } from '../../../common/TimeInterval';
import { useEffect, useState } from 'react';


export default function ThreeDComponent() {


	// Sample Data requirements
	//  xData, and yData will use moment when implemented
	const xData = ['12:00', '12:30', '13:00'];
	const yData = ['2023-06-01', '2023-06-02', '2023-06-03'];
	const zData = [
		[0, 1, 2],
		[4, 5, 6],
		[7, 8, 9]
	];

	// Api Testing/data requirement purposes only.
	const [data, setData] = useState(null);
	const unboundedInterval: TimeInterval = TimeInterval.unbounded();
	useEffect(() => {
		const fetchData = async () => {
			try {
				// const response = await fetch('https://api.example.com/data');
				// const data = await response.json();
				const threeDReadings = await readingsApi.meterThreeDReadings(21, unboundedInterval, 1);
				console.log(threeDReadings);
				const updatedData = [
					{
						type: 'surface',
						x: threeDReadings.xData,
						y: threeDReadings.yData,
						z: threeDReadings.zData,
						hoverinfo: 'text',
						hovertext: threeDReadings.zData.map((day, i) => day.map((hour, j) => `Date: ${threeDReadings.yData[i]}<br>Time: ${threeDReadings.xData[j]}<br>Usage: ${hour}`))
					}
				];
				setData(updatedData);
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};
		fetchData();
	}, []); // Run the effect only once when the component mounts (For Demo Purposes)



	const defaultState = [
		{
			type: 'surface',
			x: xData,
			y: yData,
			z: zData,
			hoverinfo: 'text',
			hovertext: zData.map((day, i) => day.map((hour, j) => `Date: ${yData[i]}<br>Time: ${xData[j]}<br>Usage: ${hour}`))
		}
	];

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
	}
	return (
		<div>
			<Plot data={data} layout={layout} config={config} />
		</div>
	);
}