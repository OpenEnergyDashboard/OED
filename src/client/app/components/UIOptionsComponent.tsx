/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// TODO TYPESCRIPT: Need definitions for this?
import Slider from 'react-rangeslider';
import * as moment from 'moment';
import { Button, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import 'react-rangeslider/lib/index.css';
import '../styles/react-rangeslider-fix.css';
import { TimeInterval } from '../../../common/TimeInterval';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import { ChangeBarStackingAction } from '../types/redux/graph';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { ChartTypes } from '../types/redux/graph';

export interface UIOptionsProps {
	chartToRender: ChartTypes;
	barStacking: boolean;
	barDuration: moment.Duration;
	compareTimeInterval: string;
	changeDuration(duration: moment.Duration): Promise<any>;
	changeBarStacking(): ChangeBarStackingAction;
	changeCompareInterval(interval: TimeInterval, duration: moment.Duration): Promise<any>;
}

interface UIOptionsState {
	barDurationDays: number;
	showSlider: boolean;
}

export default class UIOptionsComponent extends React.Component<UIOptionsProps, UIOptionsState> {
	/**
	 * Initializes the component's state, binds all functions to 'this' UIOptionsComponent
	 * @param props The props passed down through the UIOptionsContainer
	 */
	constructor(props: UIOptionsProps) {
		super(props);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.handleChangeBarStacking = this.handleChangeBarStacking.bind(this);
		this.handleSpanButton = this.handleSpanButton.bind(this);
		this.handleCompareSpanButton = this.handleCompareSpanButton.bind(this);
		this.toggleSlider = this.toggleSlider.bind(this);
		this.state = {
			barDurationDays: this.props.barDuration.asDays(),
			showSlider: false
		};
	}

	public componentWillReceiveProps(nextProps: UIOptionsProps) {
		this.setState({ barDurationDays: nextProps.barDuration.asDays() });
	}

	/**
	 * @returns JSX to create the UI options side-panel (includes dynamic rendering of meter information for selection)
	 */
	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};

		const divTopPadding: React.CSSProperties = {
			paddingTop: '15px'
		};

		const zIndexFix: React.CSSProperties = {
			zIndex: 0
		};

		const compareTimeIntervalDurationInDays = TimeInterval.fromString(this.props.compareTimeInterval).duration('days');
		let compareVal;
		if (compareTimeIntervalDurationInDays < 7) {
			compareVal = 'day';
		} else if (compareTimeIntervalDurationInDays >= 7 && compareTimeIntervalDurationInDays < 14) {
			compareVal = 'week';
		} else {
			compareVal = 'month';
		}

		return (
			<div>
				<ChartSelectContainer />
				<ChartDataSelectContainer />

				{/* Controls specific to the bar chart. */}
				{this.props.chartToRender === ChartTypes.bar &&
					<div>
						<div className='checkbox'>
							<label><input type='checkbox' onChange={this.handleChangeBarStacking} checked={this.props.barStacking} />Bar stacking</label>
						</div>
						<p style={labelStyle}>Bar chart interval:</p>
						<ToggleButtonGroup
							type='radio'
							name='timeSpans'
							value={this.state.barDurationDays}
							onChange={this.handleSpanButton}
							style={zIndexFix}
						>
							<ToggleButton value={1}>Day</ToggleButton>
							<ToggleButton value={7}>Week</ToggleButton>
							<ToggleButton value={28}>Month</ToggleButton>
						</ToggleButtonGroup>
						<Button name='customToggle' onClick={this.toggleSlider}>Toggle Custom Slider (days)</Button>

						{this.state.showSlider &&
						<Slider
							min={1}
							max={365}
							value={this.state.barDurationDays}
							onChange={this.handleBarDurationChange}
							onChangeComplete={this.handleBarDurationChangeComplete}
						/>
						}
					</div>

				}
				{/* Controls specific to the compare chart */}
				{this.props.chartToRender === ChartTypes.compare &&
				<div>
					<ToggleButtonGroup
						name='timeSpansCompare'
						value={compareVal}
						onChange={this.handleCompareSpanButton}
						style={zIndexFix}
						type='radio'
					>
						<ToggleButton value='day'>Day</ToggleButton>
						<ToggleButton value='week'>Week</ToggleButton>
						<ToggleButton value='month'>Month</ToggleButton>
					</ToggleButtonGroup>
				</div>
				}


				{/* We can't export compare data */}
				{this.props.chartToRender !== ChartTypes.compare &&
					<div style={divTopPadding}>
						<ExportContainer />
					</div>
				}
				<div style={divTopPadding}>
					<ChartLinkContainer />
				</div>
			</div>
		);
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	private handleBarDurationChange(value: number) {
		this.setState({ barDurationDays: value});
	}

	/**
	 * Called when the user releases the slider, dispatch action on temporary state variable
	 */
	private handleBarDurationChangeComplete(e: React.ChangeEvent<null>) {
		this.props.changeDuration(moment.duration( {days: this.state.barDurationDays}));
	}

	/**
	 * Toggles the bar stacking option
	 */
	private handleChangeBarStacking() {
		this.props.changeBarStacking();
	}

	// TODO TYPESCRIPT this is an issue with typings for React.FormEvent<> and ChangeEvent<>
	// The type of value is actually number
	private handleSpanButton(value: any) {
		this.props.changeDuration(moment.duration(value, 'days'));
	}

	// TODO TYPESCRIPT this is an issue with typings for React.FormEvent<> and ChangeEvent<>
	// The type of value is actually string
	private handleCompareSpanButton(value: any) {
		let compareTimeInterval;
		let compareDuration;
		switch (value) {
			case 'day':
				compareTimeInterval = new TimeInterval(moment().subtract(2, 'days'), moment()).toString();
				// fetch hours for accuracy when time interval is small
				compareDuration = moment.duration(1, 'hours');
				break;
			case 'month':
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(49, 'days'), moment()).toString();
				compareDuration = moment.duration(1, 'days');
				break;
			default: // handles week
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(7, 'days'), moment()).toString();
				compareDuration = moment.duration(1, 'days');
				break;
		}
		this.props.changeCompareInterval(TimeInterval.fromString(compareTimeInterval), compareDuration);
	}

	private toggleSlider() {
		this.setState({ showSlider: !this.state.showSlider });
	}
}
