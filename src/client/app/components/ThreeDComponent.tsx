import * as React from 'react';
import Plot from 'react-plotly.js';
import * as moment from 'moment';

export default function ThreeDComponent() {
	// Testing moment.utc()
	console.log(moment.utc(1622505600000));
	// Extract hour from moment in the format of e.g. 12:00 AM
	console.log(moment.utc(1622505600000).format('h:mm A'));
	// Extract Date from moment in the format of e.g. Jun 01, 2021
	console.log(moment.utc(1622505600000).format('MMM DD, YYYY'));

	// Data requirements
	//  xData, and yData will use moment when implemented
	const xData = ['12:00', '12:30', '13:00'];
	const yData = ['2023-06-01', '2023-06-02', '2023-06-03'];
	const zData = [
		[0, 1, 2],
		[4, 5, 6],
		[7, 8, 9]
	];

	const data = [
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
				tickformat: '%-I:%M %p'
			},
			yaxis: {
				title: 'Days of Calendar Year',
				tickformat: '%m-%d-%Y',
				dtick: 'D1' // displays every other month, will probably need to be calculated in the body to avoid cluttered labels,
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

	return (<Plot data={data} layout={layout} config={config} />);
}