/// <reference types="react" />
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
 *               layout={layout}
 *               onClick={({points, event}) => console.log(points, event)}>
 */
declare class PlotlyChart extends React.Component<IPlotlyChartProps, any> {
    container: plotly.PlotlyHTMLElement | null;
    attachListeners(): void;
    resize: () => void;
    draw: (props: IPlotlyChartProps) => Promise<void>;
    componentWillReceiveProps(nextProps: IPlotlyChartProps): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export default PlotlyChart;
