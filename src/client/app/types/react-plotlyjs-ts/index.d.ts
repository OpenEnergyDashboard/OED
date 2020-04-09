/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as plotly from 'plotly.js';
import * as React from 'react';
export interface IPlotlyChartProps {
	config?: any;
	data: any;
	layout?: any;
	onClick?: (event: plotly.PlotMouseEvent) => void;
	onBeforeHover?: (event: plotly.PlotMouseEvent) => void;
	onHover?: (event: plotly.PlotMouseEvent) => void;
	onUnHover?: (event: plotly.PlotMouseEvent) => void;
	onSelected?: (event: plotly.PlotSelectionEvent) => void;
}
/***
 * Usage:
 *  <PlotlyChart data={toJS(this.model_data)}
 *			layout={layout}
 *			onClick={({points, event}) => console.log(points, event)}>
 */
declare class PlotlyChart extends React.Component<IPlotlyChartProps, any> {
	// We might be able to avoid public on some of these but we are not using
	// a version of TS that would make that viable so all are public.
	public container: plotly.PlotlyHTMLElement | null;
	public resize: () => void;
	public draw: (props: IPlotlyChartProps) => Promise<void>;
	public attachListeners(): void;
	public componentWillReceiveProps(nextProps: IPlotlyChartProps): void;
	public componentDidMount(): void;
	public componentWillUnmount(): void;
	public render(): JSX.Element;
}
export default PlotlyChart;
