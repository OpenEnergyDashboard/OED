/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import sliderWithoutTooltips, { createSliderWithTooltip } from 'rc-slider';
import * as moment from 'moment';
import { Button, ButtonGroup } from 'reactstrap';
import { TimeInterval } from '../../../common/TimeInterval';
import TooltipHelpComponent from './TooltipHelpComponent';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import { ChangeBarStackingAction } from '../types/redux/graph';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import { ChartTypes } from '../types/redux/graph';
import 'rc-slider/assets/index.css';
import { InjectedIntlProps, FormattedMessage, injectIntl, defineMessages } from 'react-intl';

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

type UIOptionsPropsWithIntl = UIOptionsProps & InjectedIntlProps;

interface UIOptionsState {
	barDurationDays: number;
	showSlider: boolean;
}

class UIOptionsComponent extends React.Component<UIOptionsPropsWithIntl, UIOptionsState> {
	constructor(props: UIOptionsPropsWithIntl) {
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

	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		}
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

		const messages = defineMessages({ barStackingTip: {	id: 'bar.stacking.tip' }});

		return (
			<div>
				<ChartSelectContainer />
				<ChartDataSelectContainer />

				{/* Controls specific to the bar chart. */}
				{this.props.chartToRender === ChartTypes.bar &&
					<div>
						<div className='checkbox'>
							<label><input type='checkbox' onChange={this.handleChangeBarStacking} checked={this.props.barStacking} />
								<FormattedMessage id='bar.stacking' /><TooltipHelpComponent tip={this.props.intl.formatMessage(messages.barStackingTip)} />
							</label>
						</div>
						<p style={labelStyle}>
							<FormattedMessage id='bar.interval' />:
						</p>
						<ButtonGroup
							style={zIndexFix}
						>
							<Button
								outline={this.state.barDurationDays !== 1}
								onClick={() => this.handleBarButton(1)}
							>
								<FormattedMessage id='day' />
							</Button>
							<Button
								outline={this.state.barDurationDays !== 7}
								onClick={() => this.handleBarButton(7)}
							>
								<FormattedMessage id='week' />
							</Button>
							<Button
								outline={this.state.barDurationDays !== 28}
								onClick={() => this.handleBarButton(28)}
							>
								<FormattedMessage id='4.weeks' />
							</Button>
						</ButtonGroup>
						<Button
							outline={!this.state.showSlider}
							onClick={this.toggleSlider}
						>
							<FormattedMessage id='toggle.custom.slider' />
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
							<FormattedMessage id='day' />
						</Button>
						<Button
							outline={compareVal !== 'week'}
							onClick={() => this.handleCompareButton('week')}
						>
							<FormattedMessage id='week' />
						</Button>
						<Button
							outline={compareVal !== 'month'}
							onClick={() => this.handleCompareButton('month')}
						>
							<FormattedMessage id='4.weeks' />
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
			case 'month':
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
		const messages = defineMessages({
			day: {	id: 'day' },
			days: { id: 'days' }
		});
		const { formatMessage } = this.props.intl;
		if (value <= 1) {
			return `${value} ${formatMessage(messages.day)}`;
		}
		return `${value} ${formatMessage(messages.days)}`;
	}
}

export default injectIntl<UIOptionsProps>(UIOptionsComponent);
