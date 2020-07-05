/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {connect} from "react-redux";
import PlotlyChart, {IPlotlyChartProps} from "react-plotlyjs-ts";
import {State} from "../types/redux/state";
import * as plotly from "plotly.js";
import {calculateScaleFromEndpoints, CartesianPoint} from "../utils/calibration";

function mapStateToProps(state: State) {
	// set map background image
	const imageSource = state.maps.image.src;
	const layout: any = {
		width: 1000,
		height: 1000,
		xaxis: {
			visible: false, // changes all visibility settings including showgrid, zeroline, showticklabels and hiding ticks
			range: [0, 500], // range of displayed graph
		},
		yaxis: {
			visible: false,
			range: [0, 500],
			scaleanchor:'x',
		},
		images: [{
			layer: 'below',
			source: imageSource,
			xref: 'x',
			yref: 'y',
			x: 0,
			y: 0,
			sizex: 500,
			sizey: 500,
			xanchor: 'left',
			yanchor: 'bottom',
			sizing: 'contain',
			opacity: 1,
		}],
	};

	// calculate coordinates
	const points = [
		{latitude: 42.507376, longitude: -89.029548}, // front door of Maurer
		{latitude: 42.506774, longitude: -89.030068}  // down-right corner of Aldrich
		];
	const texts = ['Maurer', 'Aldrich'];
	const origin = state.maps.calibrationResult.origin;
	const opposite = state.maps.calibrationResult.opposite;
	const mapScale = calculateScaleFromEndpoints(origin, opposite, {width: state.maps.image.width, height: state.maps.image.height});
	// map coordinates to individual traces, todo: finalize mapping function
	const x = points.map(point => (point.latitude - origin.latitude) / mapScale.degreePerUnitX);
	const y = points.map(point => (point.longitude - origin.longitude) / mapScale.degreePerUnitY);
	const trace1 = {
		x: x,
		y: y,
		type: 'scatter',
		mode: 'markers',
		marker: {
			color: 'rgb(7,110,180)',
			opacity: 0.5,
			size: 6,
		},
		text: texts,
		opacity: 1,
		showlegend: false
	};
	const data = [trace1];

	/***
	 * Usage:
	 *  <PlotlyChart data={toJS(this.model_data)}
	 *               layout={layout}
	 *               onClick={({points, event}) => console.log(points, event)}>
	 */
	const props: IPlotlyChartProps = {
		data: data,
		layout: layout,
	}
	return props;
}

export default connect(mapStateToProps)(PlotlyChart);
