/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import MapChartContainer from '../containers/MapChartContainer';
import SpinnerComponent from './SpinnerComponent';
import {ChartTypes} from '../types/redux/graph';
import * as moment from 'moment';
import {TimeInterval} from '../../../common/TimeInterval';
import Button from 'reactstrap/lib/Button';
import { FormattedMessage } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import ReactTooltip from 'react-tooltip';

interface DashboardProps {
	chartToRender: ChartTypes;
	optionsVisibility: boolean;
	lineLoading: false;
	barLoading: false;
	compareLoading: false;
	mapLoading: false;
	selectedTimeInterval: TimeInterval;
	changeTimeInterval(timeInterval: TimeInterval): Promise<any>;
}


/**
 * React component that controls the dashboard
 */
export default class DashboardComponent extends React.Component<DashboardProps, {}> {
	constructor(props: DashboardProps) {
		super(props);
		this.handleTimeIntervalChange = this.handleTimeIntervalChange.bind(this);
	}

	public componentDidUpdate(prev: DashboardProps) {
		if (prev.chartToRender !== this.props.chartToRender) {
			ReactTooltip.rebuild(); // This rebuilds the tooltip so that it detects the marker that disappear because the chart type changes.
		}
	}

	public render() {
		let ChartToRender: typeof LineChartContainer | typeof MultiCompareChartContainer | typeof BarChartContainer | typeof MapChartContainer;
		let showSpinner = false;
		if (this.props.chartToRender === ChartTypes.line) {
			if (this.props.lineLoading) {
				showSpinner = true;
			}
			ChartToRender = LineChartContainer;
		} else if (this.props.chartToRender === ChartTypes.bar) {
			if (this.props.barLoading) {
				showSpinner = true;
			}
			ChartToRender = BarChartContainer;
		} else if (this.props.chartToRender === ChartTypes.compare) {
			if (this.props.compareLoading) {
				showSpinner = true;
			}
			ChartToRender = MultiCompareChartContainer;
		} else if (this.props.chartToRender === ChartTypes.map) {
			if (this.props.mapLoading) {
				showSpinner = true;
			}
			ChartToRender = MapChartContainer;
		} else {
			throw new Error('unrecognized type of chart');
		}

		const optionsClassName = this.props.optionsVisibility ? 'col-2 d-none d-lg-block' : 'd-none';
		const chartClassName = this.props.optionsVisibility ? 'col-12 col-lg-10' : 'col-12';

		const buttonMargin: React.CSSProperties = {
			marginRight: '10px'
		};

		return (
			<div className='container-fluid'>
				<div className='row'>
					<div className={optionsClassName}>
						<UIOptionsContainer />
					</div>
					<div className={`${chartClassName} align-self-auto text-center`}>
						{ showSpinner ? (
							<SpinnerComponent loading width={50} height={50} />
						) : (
							<ChartToRender />
						)}
						{ (this.props.chartToRender === ChartTypes.line) ? (
							[<Button
								key={1}
								style={buttonMargin}
								onClick={() => this.handleTimeIntervalChange('range')}
							> <FormattedMessage id='redraw'/>
							</Button>,
							<Button
								key={2}
								style={buttonMargin}
								onClick={() => this.handleTimeIntervalChange('all')}
							> <FormattedMessage id='restore'/>
							</Button>,
							<TooltipMarkerComponent
								key={3}
								page='home'
								helpTextId='help.home.chart.redraw.restore'
							/>
							]
						) : (
							null
						)}
					</div>
				</div>
			</div>
		);
	}

	private handleTimeIntervalChange(mode: string) {
		if (mode === 'all') {
			this.props.changeTimeInterval(TimeInterval.unbounded());
		} else if (mode === 'range') {
			const timeInterval = TimeInterval.fromString(getRangeSliderInterval());
			this.props.changeTimeInterval(timeInterval);
		}
	}
}

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
		return new TimeInterval(moment(newMinXTimestamp), moment(newMaxXTimestamp)).toString();
	} else {
		throw new Error('unable to get range slider params');
	}
}
