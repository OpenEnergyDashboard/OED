/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import sliderWithoutTooltips, { createSliderWithTooltip } from 'rc-slider';
import * as moment from 'moment';
import { Button, ButtonGroup } from 'reactstrap';
import { TimeInterval } from '../../../common/TimeInterval';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import { ChangeBarStackingAction } from '../types/redux/graph';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { ChartTypes } from '../types/redux/graph';
import 'rc-slider/assets/index.css';

const Slider = createSliderWithTooltip(sliderWithoutTooltips);

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
		this.formatSliderTip = this.formatSliderTip.bind(this);
		this.handleBarButton = this.handleBarButton.bind(this);
		this.handleCompareButton = this.handleCompareButton.bind(this);
		this.toggleSlider = this.toggleSlider.bind(this);
		this.state = {
			barDurationDays: this.props.barDuration.asDays(),
			showSlider: false
		};
	}


	public componentWillReceiveProps(nextProps: UIOptionsProps) {
		this.setState({barDurationDays: nextProps.barDuration.asDays()});
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
			compareVal = 'four weeks';
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
						<ButtonGroup
							style={zIndexFix}
						>
							<Button
								outline={this.state.barDurationDays !== 1}
								onClick={() => this.handleBarButton(1)}
							>
								Day
							</Button>
							<Button
								outline={this.state.barDurationDays !== 7}
								onClick={() => this.handleBarButton(7)}
							>
								Week
							</Button>
							<Button
								outline={this.state.barDurationDays !== 28}
								onClick={() => this.handleBarButton(28)}
							>
								4 Weeks
							</Button>
						</ButtonGroup>
						<Button
							outline={!this.state.showSlider}
							onClick={this.toggleSlider}
						>
							Toggle custom slider
						</Button>
						{this.state.showSlider &&
							<div style={divTopPadding}>
								<Slider
									min={1}
									max={365}
									value={this.state.barDurationDays}
									onChange={this.handleBarDurationChange}
									onAfterChange={this.handleBarDurationChangeComplete}
									tipFormatter={this.formatSliderTip}
									trackStyle={{ backgroundColor: 'gray', height: 10 }}
									handleStyle={[{
										height: 28,
										width: 28,
										marginLeft: -14,
										marginTop: -9,
										backgroundColor: 'white'
									}]}
									railStyle={{ backgroundColor: 'gray', height: 10 }}
								/>
							</div>
						}
					</div>

				}
				{/* Controls specific to the compare chart */}
				{this.props.chartToRender === ChartTypes.compare &&
				<div>
					<ButtonGroup
						style={zIndexFix}
					>
						<Button
							outline={compareVal !== 'day'}
							onClick={() => this.handleCompareButton('day')}
						>
							Day
						</Button>
						<Button
							outline={compareVal !== 'week'}
							onClick={() => this.handleCompareButton('week')}
						>
							Week
						</Button>
						<Button
							outline={compareVal !== 'four weeks'}
							onClick={() => this.handleCompareButton('four weeks')}
						>
							4 Weeks
						</Button>
					</ButtonGroup>
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
	 * Handles a change in meter selection
	 * @param {Object[]} selection An array of {label: string, value: {type: string, id: int}} representing the current selection
	 */
	// private handleMeterSelect(selection: Array<{label: string, value: {type: string, id: number}}>) {
	// 	this.props.selectMeters(selection.map(s => s.value));
	// }

	/**
	 * Called when the user releases the slider, dispatch action on temporary state variable
	 */
	private handleBarDurationChangeComplete(e: any) {
		this.props.changeDuration(moment.duration(this.state.barDurationDays, 'days'));
	}

	private handleBarButton(value: number) {
		this.props.changeDuration(moment.duration(value, 'days'));
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	private handleBarDurationChange(value: number) {
		this.setState({ barDurationDays: value});
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

	private handleCompareButton(value: string) {
		let compareTimeInterval: TimeInterval;
		let compareDuration;
		switch (value) {
			case 'day':
				compareTimeInterval = new TimeInterval(moment().subtract(2, 'days'), moment());
				// fetch hours for accuracy when time interval is small
				compareDuration = moment.duration(1, 'hours');
				break;
			case 'four weeks':
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(49, 'days'), moment());
				compareDuration = moment.duration(1, 'days');
				break;
			default: // handles week
				compareTimeInterval = new TimeInterval(moment().startOf('week').subtract(7, 'days'), moment());
				compareDuration = moment.duration(1, 'days');
				break;
		}
		this.props.changeCompareInterval(compareTimeInterval, compareDuration);
	}

	private toggleSlider() {
		this.setState({ showSlider: !this.state.showSlider });
	}

	private formatSliderTip(value: number) {
		if (value <= 1) {
			return `${value} day`;
		}
		return `${value} days`;
	}
}
