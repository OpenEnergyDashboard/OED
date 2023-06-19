import * as React from 'react';
import Plot from 'react-plotly.js';

export default function ThreeDComponent() {
	// Sample Dummy Data pulled from some online resource.
	const numPoints = 100;
	const xValues = Array.from({ length: numPoints }, (_, i) => i / numPoints); // Generate x values
	const yValues = Array.from({ length: numPoints }, (_, i) => i / numPoints); // Generate y values
	const zValues = xValues.map(x => yValues.map(y => Math.sin(x * 2 * Math.PI) * Math.sin(y * 2 * Math.PI)));

	const data = [
		{
			z: zValues,
			type: 'surface'
		}
	];

	const layout = {
		autosize: true,
		showlegend: true,
		height: 700,
		scene: {
			xaxis: { title: 'Days of Calendar Year' },
			yaxis: { title: 'Hours of Day' },
			zaxis: { title: 'Resource Usage' },
			camera: {
				eye: {
					x: 1, // Adjust x value for zoom
					y: 2, // Adjust y value for zoom
					z: 0 // Adjust z value for zoom
				}
			}
		}
	};
	const config = {
		responsive: true
	}

	return (
		<Plot data={data} layout={layout} config={config} />
	);
}