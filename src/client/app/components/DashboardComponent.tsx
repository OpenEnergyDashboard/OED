/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { defaults } from 'chart.js';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';
import MultiCompareChartContainer from '../containers/MultiCompareChartContainer';
import SpinnerComponent from './SpinnerComponent';
import { ChartTypes } from '../types/redux/graph';

import * as moment from 'moment';
import { TimeInterval } from '../../../common/TimeInterval';

import Button from 'reactstrap/lib/Button';
import { FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Dispatch, Thunk, ActionType } from '../types/redux/actions';

import * as Plotly from 'plotly.js';

defaults.plugins = {
	datalabels: {
		display: false
	}
};


interface DashboardProps {
	chartToRender: ChartTypes;
	optionsVisibility: boolean;
	lineLoading: false;
	barLoading: false;
	compareLoading: false;
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

	public render(){
		let ChartToRender: typeof LineChartContainer | typeof MultiCompareChartContainer | typeof BarChartContainer;
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
		} else {
			if (this.props.compareLoading) {
				showSpinner = true;
			}
			ChartToRender = MultiCompareChartContainer;
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
					<div className={`${chartClassName} align-self-center text-center`}>
						{ showSpinner ? (
							<SpinnerComponent loading width={50} height={50} />
						) : (
							<ChartToRender />
						)}
						{ (this.props.chartToRender === ChartTypes.line) ? (
							[<Button key={1}
								style={buttonMargin}
								onClick={() => this.handleTimeIntervalChange("range")}
							> Redraw
							</Button>,
							<Button key={2}
								style={buttonMargin}
								onClick={() => this.handleTimeIntervalChange("all")}
							> Restore
							</Button>]
						) : (
							null
						)}
					</div>
				</div>
			</div>
		);		
	}

	private handleTimeIntervalChange(mode: string) {
		if (mode == "all"){
			this.props.changeTimeInterval(TimeInterval.unbounded());			
		}else{
			let sliderContainer: any = document.querySelector(".rangeslider-bg");
			let sliderBox: any = document.querySelector(".rangeslider-slidebox");
			let root: any = document.getElementById("root");	

			if (sliderContainer && sliderBox && root){
				// Attributes of the slider: full width and the min & max values of the box
				let fullWidth: number = parseInt(sliderContainer.getAttribute("width"));
				let sliderMinX: number = parseInt(sliderBox.getAttribute("x"));
				let sliderMaxX: number = sliderMinX + parseInt(sliderBox.getAttribute("width"));
				if (sliderMaxX - sliderMinX == fullWidth) return;

				// From the Plotly line graph, get current min and max times in seconds
				let minTimeStamp: number = parseInt(root.getAttribute("min-timestamp"));
				let maxTimeStamp: number = parseInt(root.getAttribute("max-timestamp"));

				// Seconds displayed on graph
				let deltaSeconds: number = maxTimeStamp - minTimeStamp;
				let secondsPerPixel: number = deltaSeconds / fullWidth;

				// Get the new min and max times, in seconds, from the slider box
				let newMinXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMinX));
				let newMaxXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMaxX));

				let timeInterval = new TimeInterval(moment(newMinXTimestamp), moment(newMaxXTimestamp));
				this.props.changeTimeInterval(timeInterval);
			}			
		}
	}
}
