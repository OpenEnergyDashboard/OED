/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PlotlyChart from 'react-plotlyjs-ts';
import * as plotly from 'plotly.js';
import * as React from 'react';
import {CartesianPoint} from '../utils/calibration';

interface CalibrationChartProps {
	data: object;
	layout: object;
	updateGraphCoordinates: any;
}

export default class MapCalibration_ChartDisplayComponent extends React.Component<CalibrationChartProps, {}>{
	constructor(props: CalibrationChartProps) {
		super(props);
		this.handlePointClick = this.handlePointClick.bind(this);
		this.getClickedCoordinates = this.getClickedCoordinates.bind(this);
	}

	public render() {
		return (
			<PlotlyChart data={this.props.data} layout={this.props.layout} onClick={this.handlePointClick.bind(this)}/>
		);
	}

	private handlePointClick(event: plotly.PlotMouseEvent) {
		event.event.preventDefault();
		let currentPoint = this.getClickedCoordinates(event);
		this.props.updateGraphCoordinates(currentPoint);
	}

	private getClickedCoordinates(event: plotly.PlotMouseEvent) {
		event.event.preventDefault();
		// both points will be captured if there is already a data point nearby
		for(let i=0; i < event.points.length; i++) {
			let pn = event.points[i].pointNumber;
			let tn = event.points[i].curveNumber;
			console.log(`trace number: ${tn}`);
		}
		// actual code;
		const xValue = event.points[0].x as number;
		const yValue = event.points[0].y as number;
		const clickedPoint: CartesianPoint = {
			x: Number(xValue.toFixed(6)),
			y: Number(yValue.toFixed(6)),
		};
		return clickedPoint;
	}
}
